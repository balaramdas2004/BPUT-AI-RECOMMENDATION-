import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, TrendingUp, Flame } from 'lucide-react';

interface GamificationStats {
  total_points: number;
  level: number;
  experience: number;
  streak_days: number;
}

export const GamificationStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) return;

      let { data: gamification } = await supabase
        .from('student_gamification')
        .select('*')
        .eq('student_id', student.id)
        .single();

      // Initialize gamification record if not exists
      if (!gamification) {
        const { data: newGamification } = await supabase
          .from('student_gamification')
          .insert({
            student_id: student.id,
            total_points: 0,
            level: 1,
            experience: 0,
            streak_days: 0
          })
          .select()
          .single();
        gamification = newGamification;
      }

      setStats(gamification);
    } catch (error) {
      console.error('Error loading gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  const experienceForNextLevel = stats.level * 100;
  const experienceProgress = (stats.experience / experienceForNextLevel) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('gamification.level')}
          </CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.level}</div>
          <div className="mt-2">
            <Progress value={experienceProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.experience} / {experienceForNextLevel} XP
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('gamification.points')}
          </CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_points}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Total earned points
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('gamification.experience')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.experience}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Experience points
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('gamification.streak')}
          </CardTitle>
          <Flame className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.streak_days}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Consecutive days active
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
