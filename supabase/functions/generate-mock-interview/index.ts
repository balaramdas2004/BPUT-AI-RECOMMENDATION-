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
    const { interviewType, difficulty, studentId } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Get student data for context
    const { data: student } = await supabase
      .from('students')
      .select('*, student_skills(skills(name))')
      .eq('id', studentId)
      .single();

    // Generate questions using Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert interviewer generating ${interviewType} interview questions at ${difficulty} difficulty level.`
          },
          {
            role: 'user',
            content: `Generate 5 ${interviewType} interview questions for a student with skills: ${student?.student_skills?.map((s: any) => s.skills?.name).join(', ') || 'general'}. Each question should include: question text, 4 multiple choice options, correct answer, explanation, and expected key points. Return as JSON array with format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "...", "expectedPoints": ["point1", "point2"]}]`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_questions",
            description: "Generate interview questions with quiz options",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: {
                        type: "array",
                        items: { type: "string" },
                        description: "4 multiple choice options"
                      },
                      correctAnswer: { 
                        type: "string",
                        description: "The correct answer from options"
                      },
                      explanation: {
                        type: "string",
                        description: "Detailed explanation of the correct answer"
                      },
                      expectedPoints: {
                        type: "array",
                        items: { type: "string" },
                        description: "Key points to cover in answer"
                      }
                    },
                    required: ["question", "options", "correctAnswer", "explanation", "expectedPoints"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_questions" } }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const questions = toolCall ? JSON.parse(toolCall.function.arguments).questions : [];

    // Create mock interview session
    const { data: mockInterview, error } = await supabase
      .from('mock_interviews')
      .insert({
        student_id: studentId,
        interview_type: interviewType,
        difficulty,
        questions,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      mockInterview,
      questions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error generating mock interview:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});