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
    const { reportType, filters, format } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    let reportData: any = {};

    switch (reportType) {
      case 'placement_overview':
        reportData = await generatePlacementOverview(supabase, filters);
        break;
      case 'skill_gap_analysis':
        reportData = await generateSkillGapAnalysis(supabase, filters);
        break;
      case 'department_performance':
        reportData = await generateDepartmentPerformance(supabase, filters);
        break;
      case 'employer_engagement':
        reportData = await generateEmployerEngagement(supabase, filters);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return new Response(JSON.stringify({
      success: true,
      reportType,
      filters,
      data: reportData,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function generatePlacementOverview(supabase: any, filters: any) {
  const { data: stats } = await supabase
    .from('placement_statistics')
    .select('*')
    .gte('academic_year', filters.yearFrom || '2020')
    .lte('academic_year', filters.yearTo || '2025');

  const { data: applications } = await supabase
    .from('applications')
    .select('*, job_postings(*), students(*)')
    .gte('applied_at', filters.dateFrom || '2020-01-01')
    .lte('applied_at', filters.dateTo || new Date().toISOString());

  return {
    summary: {
      totalStudents: stats?.reduce((sum: number, s: any) => sum + s.total_students, 0) || 0,
      placedStudents: stats?.reduce((sum: number, s: any) => sum + s.placed_students, 0) || 0,
      averagePackage: stats?.reduce((sum: number, s: any) => sum + parseFloat(s.average_package || 0), 0) / (stats?.length || 1),
      highestPackage: Math.max(...(stats?.map((s: any) => parseFloat(s.highest_package || 0)) || [0]))
    },
    byDepartment: stats || [],
    applicationTrends: applications || []
  };
}

async function generateSkillGapAnalysis(supabase: any, filters: any) {
  const { data: demandTrends } = await supabase
    .from('skill_demand_trends')
    .select('*')
    .order('demand_score', { ascending: false });

  const { data: studentSkills } = await supabase
    .from('student_skills')
    .select('skill_id, skills(name, category)');

  const skillSupply = studentSkills?.reduce((acc: any, ss: any) => {
    const skillName = ss.skills?.name;
    acc[skillName] = (acc[skillName] || 0) + 1;
    return acc;
  }, {});

  const gaps = demandTrends?.map((trend: any) => ({
    skill: trend.skill_name,
    demand: trend.job_postings_count,
    supply: skillSupply[trend.skill_name] || 0,
    gap: trend.job_postings_count - (skillSupply[trend.skill_name] || 0),
    category: trend.category
  })) || [];

  return {
    topGaps: gaps.filter((g: any) => g.gap > 0).slice(0, 10),
    byCategory: groupByCategory(gaps),
    recommendations: generateSkillRecommendations(gaps)
  };
}

async function generateDepartmentPerformance(supabase: any, filters: any) {
  const { data: students } = await supabase
    .from('students')
    .select('department, branch, applications(status), career_readiness_scores(overall_score)');

  const departmentStats = students?.reduce((acc: any, student: any) => {
    const dept = student.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = {
        totalStudents: 0,
        placedStudents: 0,
        avgReadinessScore: 0,
        readinessScores: []
      };
    }
    acc[dept].totalStudents++;
    
    const hasPlacement = student.applications?.some((a: any) => a.status === 'accepted');
    if (hasPlacement) acc[dept].placedStudents++;
    
    if (student.career_readiness_scores?.[0]?.overall_score) {
      acc[dept].readinessScores.push(student.career_readiness_scores[0].overall_score);
    }
    
    return acc;
  }, {});

  Object.keys(departmentStats || {}).forEach(dept => {
    const scores = departmentStats[dept].readinessScores;
    departmentStats[dept].avgReadinessScore = scores.length > 0
      ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
      : 0;
    delete departmentStats[dept].readinessScores;
  });

  return departmentStats || {};
}

async function generateEmployerEngagement(supabase: any, filters: any) {
  const { data: employers } = await supabase
    .from('employers')
    .select(`
      *,
      job_postings(id, status, created_at),
      job_postings!inner(applications(id, status))
    `);

  return employers?.map((emp: any) => ({
    companyName: emp.company_name,
    totalJobs: emp.job_postings?.length || 0,
    activeJobs: emp.job_postings?.filter((jp: any) => jp.status === 'active').length || 0,
    totalApplications: emp.job_postings?.reduce((sum: number, jp: any) => 
      sum + (jp.applications?.length || 0), 0) || 0,
    verificationStatus: emp.verification_status
  })) || [];
}

function groupByCategory(gaps: any[]) {
  return gaps.reduce((acc: any, gap: any) => {
    if (!acc[gap.category]) {
      acc[gap.category] = [];
    }
    acc[gap.category].push(gap);
    return acc;
  }, {});
}

function generateSkillRecommendations(gaps: any[]) {
  const topGaps = gaps
    .filter(g => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5);

  return topGaps.map(gap => ({
    skill: gap.skill,
    priority: gap.gap > 50 ? 'high' : gap.gap > 20 ? 'medium' : 'low',
    recommendation: `Increase training programs for ${gap.skill}. Current gap: ${gap.gap} students needed.`
  }));
}