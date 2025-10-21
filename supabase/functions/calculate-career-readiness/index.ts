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
    const { studentId } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Fetch student data
    const { data: student } = await supabase
      .from('students')
      .select('*, academic_records(*), student_skills(*), projects(*), certifications(*)')
      .eq('id', studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    // Calculate academic score (0-100)
    const academicScore = calculateAcademicScore(student);
    
    // Calculate skills score (0-100)
    const skillsScore = calculateSkillsScore(student);
    
    // Calculate experience score (0-100)
    const experienceScore = calculateExperienceScore(student);
    
    // Calculate soft skills score (0-100)
    const softSkillsScore = calculateSoftSkillsScore(student);
    
    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (academicScore * 0.3) +
      (skillsScore * 0.3) +
      (experienceScore * 0.25) +
      (softSkillsScore * 0.15)
    );

    // Generate recommendations
    const recommendations = generateRecommendations({
      academicScore,
      skillsScore,
      experienceScore,
      softSkillsScore
    });

    // Store the score
    const { error: insertError } = await supabase
      .from('career_readiness_scores')
      .insert({
        student_id: studentId,
        overall_score: overallScore,
        academic_score: academicScore,
        skills_score: skillsScore,
        experience_score: experienceScore,
        soft_skills_score: softSkillsScore,
        recommendations,
        analysis: {
          strengths: identifyStrengths({ academicScore, skillsScore, experienceScore, softSkillsScore }),
          weaknesses: identifyWeaknesses({ academicScore, skillsScore, experienceScore, softSkillsScore }),
          nextSteps: generateNextSteps({ academicScore, skillsScore, experienceScore, softSkillsScore })
        }
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      success: true,
      scores: {
        overall: overallScore,
        academic: academicScore,
        skills: skillsScore,
        experience: experienceScore,
        softSkills: softSkillsScore
      },
      recommendations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error calculating career readiness:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function calculateAcademicScore(student: any): number {
  const cgpa = student.cgpa || 0;
  const academicRecords = student.academic_records || [];
  
  // CGPA contributes 70%
  const cgpaScore = (cgpa / 10) * 70;
  
  // Consistency contributes 30%
  const avgSgpa = academicRecords.reduce((sum: number, rec: any) => sum + (rec.sgpa || 0), 0) / (academicRecords.length || 1);
  const consistencyScore = (avgSgpa / 10) * 30;
  
  return Math.min(100, Math.round(cgpaScore + consistencyScore));
}

function calculateSkillsScore(student: any): number {
  const skills = student.student_skills || [];
  const certifications = student.certifications || [];
  
  // Number of skills (max 50 points)
  const skillsCount = Math.min(skills.length * 5, 50);
  
  // Verified certifications (max 50 points)
  const verifiedCerts = certifications.filter((c: any) => c.verified).length;
  const certsScore = Math.min(verifiedCerts * 10, 50);
  
  return Math.round(skillsCount + certsScore);
}

function calculateExperienceScore(student: any): number {
  const projects = student.projects || [];
  const certifications = student.certifications || [];
  
  // Projects (max 60 points)
  const projectsScore = Math.min(projects.length * 15, 60);
  
  // Certifications (max 40 points)
  const certsScore = Math.min(certifications.length * 10, 40);
  
  return Math.round(projectsScore + certsScore);
}

function calculateSoftSkillsScore(student: any): number {
  // Based on extracurricular activities and profile completeness
  const hasLinkedIn = !!student.linkedin_url;
  const hasGithub = !!student.github_url;
  const hasPortfolio = !!student.portfolio_url;
  const hasBio = !!student.bio;
  
  let score = 0;
  if (hasLinkedIn) score += 25;
  if (hasGithub) score += 25;
  if (hasPortfolio) score += 25;
  if (hasBio) score += 25;
  
  return score;
}

function generateRecommendations(scores: any): string[] {
  const recommendations: string[] = [];
  
  if (scores.academicScore < 70) {
    recommendations.push("Focus on improving your CGPA through consistent academic performance");
  }
  if (scores.skillsScore < 70) {
    recommendations.push("Add more technical skills and obtain relevant certifications");
  }
  if (scores.experienceScore < 70) {
    recommendations.push("Build more projects and participate in hackathons or internships");
  }
  if (scores.softSkillsScore < 70) {
    recommendations.push("Complete your professional profiles (LinkedIn, GitHub, Portfolio)");
  }
  
  return recommendations.length > 0 ? recommendations : ["Excellent work! Keep maintaining your current trajectory"];
}

function identifyStrengths(scores: any): string[] {
  const strengths: string[] = [];
  if (scores.academicScore >= 80) strengths.push("Strong academic performance");
  if (scores.skillsScore >= 80) strengths.push("Excellent technical skills");
  if (scores.experienceScore >= 80) strengths.push("Outstanding practical experience");
  if (scores.softSkillsScore >= 80) strengths.push("Professional online presence");
  return strengths;
}

function identifyWeaknesses(scores: any): string[] {
  const weaknesses: string[] = [];
  if (scores.academicScore < 60) weaknesses.push("Academic performance needs improvement");
  if (scores.skillsScore < 60) weaknesses.push("Limited technical skills");
  if (scores.experienceScore < 60) weaknesses.push("Lack of practical experience");
  if (scores.softSkillsScore < 60) weaknesses.push("Incomplete professional profiles");
  return weaknesses;
}

function generateNextSteps(scores: any): string[] {
  const nextSteps: string[] = [];
  
  const sortedScores = [
    { name: 'academic', score: scores.academicScore },
    { name: 'skills', score: scores.skillsScore },
    { name: 'experience', score: scores.experienceScore },
    { name: 'softSkills', score: scores.softSkillsScore }
  ].sort((a, b) => a.score - b.score);
  
  const lowestArea = sortedScores[0].name;
  
  switch (lowestArea) {
    case 'academic':
      nextSteps.push("Schedule regular study sessions", "Seek academic support from professors");
      break;
    case 'skills':
      nextSteps.push("Enroll in online courses", "Earn industry-recognized certifications");
      break;
    case 'experience':
      nextSteps.push("Start a personal project", "Apply for internships");
      break;
    case 'softSkills':
      nextSteps.push("Create/update LinkedIn profile", "Build a portfolio website");
      break;
  }
  
  return nextSteps;
}