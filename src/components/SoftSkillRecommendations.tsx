import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Youtube, CheckCircle, Target,
  BookOpen, Video, Award
} from 'lucide-react';
import { 
  SoftSkillRecommendation, 
  getYouTubeEmbedUrl 
} from '@/utils/SoftSkillRecommendations';
import { useState } from 'react';

interface SoftSkillRecommendationsProps {
  recommendations: SoftSkillRecommendation[];
}

export default function SoftSkillRecommendations({ recommendations }: SoftSkillRecommendationsProps) {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Award className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <h3 className="font-semibold text-lg mb-2">Excellent Performance!</h3>
          <p className="text-muted-foreground">
            Your soft skills are at a high level. Keep practicing to maintain your excellence!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Soft Skills Development Plan
          </CardTitle>
          <CardDescription>
            Personalized recommendations to improve your interview performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="space-y-4 pb-6 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{rec.skill}</h4>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Current</span>
                          <span className="font-medium">{rec.currentLevel}/100</span>
                        </div>
                        <Progress value={rec.currentLevel} />
                      </div>
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium text-green-600">{rec.targetLevel}/100</span>
                        </div>
                        <Progress value={rec.targetLevel} className="bg-green-100" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Focus Areas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rec.improvementAreas.map((area, i) => (
                      <Badge key={i} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedSkill(expandedSkill === rec.skill ? null : rec.skill)}
                  className="w-full"
                >
                  <Video className="w-4 h-4 mr-2" />
                  {expandedSkill === rec.skill ? 'Hide' : 'View'} Learning Resources
                </Button>

                {expandedSkill === rec.skill && (
                  <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                    {/* YouTube Videos */}
                    <div>
                      <h5 className="font-medium mb-3 flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        Recommended Videos
                      </h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        {rec.youtubeVideos.map((video, i) => (
                          <Card key={i} className="overflow-hidden">
                            <div className="aspect-video bg-black">
                              <iframe
                                width="100%"
                                height="100%"
                                src={getYouTubeEmbedUrl(video.videoId)}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                referrerPolicy="strict-origin-when-cross-origin"
                              />
                            </div>
                            <CardContent className="p-3">
                              <h6 className="font-semibold text-sm mb-1">{video.title}</h6>
                              <p className="text-xs text-muted-foreground mb-2">
                                {video.channel}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {video.skillArea}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Practice Exercises */}
                    <div>
                      <h5 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Practice Exercises
                      </h5>
                      <ul className="space-y-2">
                        {rec.practiceExercises.map((exercise, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span>{exercise}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
