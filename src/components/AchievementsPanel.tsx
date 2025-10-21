import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  unlocked?: boolean;
  unlocked_at?: string;
}

interface AchievementsPanelProps {
  studentId?: string;
}

export const AchievementsPanel = ({ studentId }: AchievementsPanelProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) return;

      // Get all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: false });

      // Get unlocked achievements
      const { data: unlockedAchievements } = await supabase
        .from('student_achievements')
        .select('achievement_id, unlocked_at')
        .eq('student_id', student.id);

      const unlockedMap = new Map(
        unlockedAchievements?.map(a => [a.achievement_id, a.unlocked_at]) || []
      );

      const achievementsWithStatus = allAchievements?.map(achievement => ({
        ...achievement,
        unlocked: unlockedMap.has(achievement.id),
        unlocked_at: unlockedMap.get(achievement.id)
      })) || [];

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load achievements',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(achievements.map(a => a.category))];
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Award;
    return <Icon className="h-8 w-8" />;
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('gamification.achievements')}</span>
            <Badge variant="secondary">
              {unlockedCount} / {totalCount} {t('gamification.unlocked')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('gamification.progress')}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full flex-wrap h-auto">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="flex-1">
              {category === 'all' ? t('common.all') : t(`gamification.categories.${category}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`transition-all ${achievement.unlocked ? 'border-primary' : 'opacity-60'}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getIcon(achievement.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <Badge variant={achievement.unlocked ? 'default' : 'secondary'}>
                          {achievement.points} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      {achievement.unlocked && achievement.unlocked_at && (
                        <p className="text-xs text-muted-foreground">
                          {t('gamification.unlocked')}: {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </p>
                      )}
                      {!achievement.unlocked && (
                        <Badge variant="outline" className="mt-2">
                          {t('gamification.locked')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
