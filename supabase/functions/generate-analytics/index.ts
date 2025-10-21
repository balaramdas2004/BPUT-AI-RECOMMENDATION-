import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year, department, branch } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Build query for placement statistics
    let placementQuery = supabase
      .from('placement_statistics')
      .select('*');

    if (year && year !== 'all') {
      placementQuery = placementQuery.eq('academic_year', year);
    }
    if (department && department !== 'all') {
      placementQuery = placementQuery.eq('department', department);
    }
    if (branch && branch !== 'all') {
      placementQuery = placementQuery.eq('branch', branch);
    }

    const { data: placementStats, error: placementError } = await placementQuery
      .order('academic_year', { ascending: false });

    if (placementError) throw placementError;

    // Get skill demand trends
    const { data: skillTrends, error: skillError } = await supabase
      .from('skill_demand_trends')
      .select('*')
      .order('demand_score', { ascending: false })
      .limit(20);

    if (skillError) throw skillError;

    // Calculate aggregated metrics
    const totalStudents = placementStats?.reduce((sum, stat) => sum + (stat.total_students || 0), 0) || 0;
    const totalPlaced = placementStats?.reduce((sum, stat) => sum + (stat.placed_students || 0), 0) || 0;
    const overallPlacementRate = totalStudents > 0 ? (totalPlaced / totalStudents * 100).toFixed(2) : 0;
    
    const avgPackageSum = placementStats?.reduce((sum, stat) => sum + (stat.average_package || 0), 0) || 0;
    const avgPackage = placementStats?.length > 0 ? Math.round(avgPackageSum / placementStats.length) : 0;
    
    const highestPackage = Math.max(...(placementStats?.map(s => s.highest_package || 0) || [0]));
    const totalCompanies = placementStats?.reduce((sum, stat) => sum + (stat.companies_visited || 0), 0) || 0;

    // Prepare branch-wise data
    const branchWiseData = placementStats?.reduce((acc: any, stat) => {
      const key = stat.branch || 'Unknown';
      if (!acc[key]) {
        acc[key] = {
          branch: key,
          totalStudents: 0,
          placedStudents: 0,
          averagePackage: 0,
          count: 0
        };
      }
      acc[key].totalStudents += stat.total_students || 0;
      acc[key].placedStudents += stat.placed_students || 0;
      acc[key].averagePackage += stat.average_package || 0;
      acc[key].count += 1;
      return acc;
    }, {});

    const branchWiseStats = Object.values(branchWiseData || {}).map((item: any) => ({
      branch: item.branch,
      totalStudents: item.totalStudents,
      placedStudents: item.placedStudents,
      placementRate: item.totalStudents > 0 ? ((item.placedStudents / item.totalStudents) * 100).toFixed(2) : 0,
      averagePackage: item.count > 0 ? Math.round(item.averagePackage / item.count) : 0
    }));

    // Year-wise trend
    const yearWiseData = placementStats?.reduce((acc: any, stat) => {
      const key = stat.academic_year;
      if (!acc[key]) {
        acc[key] = {
          year: key,
          totalStudents: 0,
          placedStudents: 0,
          averagePackage: 0,
          count: 0
        };
      }
      acc[key].totalStudents += stat.total_students || 0;
      acc[key].placedStudents += stat.placed_students || 0;
      acc[key].averagePackage += stat.average_package || 0;
      acc[key].count += 1;
      return acc;
    }, {});

    const yearWiseTrends = Object.values(yearWiseData || {}).map((item: any) => ({
      year: item.year,
      placementRate: item.totalStudents > 0 ? ((item.placedStudents / item.totalStudents) * 100).toFixed(2) : 0,
      averagePackage: item.count > 0 ? Math.round(item.averagePackage / item.count) : 0
    })).sort((a, b) => a.year.localeCompare(b.year));

    // Skill categories distribution
    const skillCategories = skillTrends?.reduce((acc: any, skill) => {
      const category = skill.category;
      if (!acc[category]) {
        acc[category] = { category, count: 0, avgDemand: 0 };
      }
      acc[category].count += 1;
      acc[category].avgDemand += skill.demand_score || 0;
      return acc;
    }, {});

    const categoryDistribution = Object.values(skillCategories || {}).map((item: any) => ({
      category: item.category,
      count: item.count,
      avgDemand: Math.round(item.avgDemand / item.count)
    }));

    // Top in-demand skills
    const topSkills = skillTrends?.slice(0, 10).map(skill => ({
      name: skill.skill_name,
      demand: skill.demand_score,
      jobs: skill.job_postings_count,
      trend: skill.trend,
      premium: skill.salary_premium
    })) || [];

    // Skill gaps (skills with high demand but low student proficiency)
    const { data: studentSkills } = await supabase
      .from('student_skills')
      .select('skill_id, skills(name)');

    const studentSkillCounts: Record<string, number> = {};
    if (studentSkills) {
      for (const item of studentSkills) {
        const skill = item.skills as any;
        const skillName = skill?.name;
        if (skillName) {
          studentSkillCounts[skillName] = (studentSkillCounts[skillName] || 0) + 1;
        }
      }
    }

    const skillGaps = skillTrends
      ?.filter(skill => skill.demand_score >= 80)
      .map(skill => ({
        name: skill.skill_name,
        demand: skill.demand_score,
        studentCount: studentSkillCounts[skill.skill_name] || 0,
        gap: skill.demand_score - (studentSkillCounts[skill.skill_name] || 0)
      }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 10) || [];

    return new Response(JSON.stringify({
      summary: {
        totalStudents,
        totalPlaced,
        overallPlacementRate,
        avgPackage,
        highestPackage,
        totalCompanies
      },
      placementStats,
      branchWiseStats,
      yearWiseTrends,
      skillTrends: topSkills,
      categoryDistribution,
      skillGaps
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-analytics:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
