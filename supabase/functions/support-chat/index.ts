import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an intelligent support assistant for BPUT CareerAI Platform, a comprehensive career development and placement system.

Your role:
- Provide helpful, accurate information about the platform
- Assist ${userType || 'users'} with their queries
- Help troubleshoot common issues
- Guide users through platform features
- Report and categorize student problems

Platform Features:
1. Resume Analysis - AI-powered resume parsing and career recommendations
2. Mock Interviews - AI video interview analysis with feedback
3. Job Matching - Smart company recommendations based on skills
4. Learning Resources - YouTube video recommendations for skill development
5. Application Tracking - Track job applications and interview status
6. Analytics Dashboard - View performance metrics and insights

Common Issues & Solutions:
- Resume upload errors: Ensure file is PDF/DOC/DOCX under 10MB
- Mock interview not working: Check camera/mic permissions
- Login issues: Verify email and password, check role assignment
- Missing data: Ensure profile is complete with skills and education

For Student Problems:
- Technical issues: Provide step-by-step troubleshooting
- Account access: Guide through password reset
- Feature usage: Explain how to use specific features
- Data concerns: Address privacy and data security questions

Communication Style:
- Be friendly, professional, and concise
- Use bullet points for clarity
- Provide specific steps when troubleshooting
- Ask clarifying questions when needed
- Escalate complex issues to human support

CRITICAL: If a user reports a serious bug, data loss, or security concern, acknowledge it seriously and suggest contacting support@bputcareerai.edu.in immediately.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Too many requests. Please wait a moment and try again.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Service temporarily unavailable. Please contact support.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI service error');
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not process your request.';

    return new Response(JSON.stringify({ 
      success: true, 
      message: aiMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in support-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process chat request',
        message: 'I apologize, but I encountered an error. Please try again or contact support@bputcareerai.edu.in for assistance.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
