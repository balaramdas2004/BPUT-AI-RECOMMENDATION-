import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  points: number;
  level: number;
  branch: string;
}

export const Leaderboard = () => {
  const { t } = useTranslation();
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [branchLeaderboard, setBranchLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current student
      const { data: currentStudent } = await supabase
        .from('students')
        .select('id, branch')
        .eq('user_id', user.id)
        .single();

      // Get overall leaderboard
      const { data: gamificationData } = await supabase
        .from('student_gamification')
        .select(`
          total_points,
          level,
          student_id,
          students (
            user_id,
            branch,
            profiles (
              full_name
            )
          )
        `)
        .order('total_points', { ascending: false })
        .limit(50);

      const overallData = gamificationData?.map((entry: any, index) => ({
        rank: index + 1,
        student_id: entry.student_id,
        student_name: entry.students?.profiles?.full_name || 'Anonymous',
        points: entry.total_points,
        level: entry.level,
        branch: entry.students?.branch || 'N/A'
      })) || [];

      setOverallLeaderboard(overallData);

      // Find current user rank
      if (currentStudent?.id) {
        setCurrentStudentId(currentStudent.id);
        const userRank = overallData.findIndex(e => e.student_id === currentStudent.id);
        setCurrentUserRank(userRank >= 0 ? userRank + 1 : null);
      }

      // Get branch leaderboard
      if (currentStudent?.branch) {
        const branchData = overallData.filter(e => e.branch === currentStudent.branch);
        setBranchLeaderboard(branchData);
      }

      // For monthly, we'll use the same data but in a real app this would be filtered by date
      setMonthlyLeaderboard(overallData);

    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return <span className="text-sm font-semibold">#{rank}</span>;
  };

  const renderLeaderboard = (data: LeaderboardEntry[]) => (
    <div className="space-y-2">
      {data.map((entry) => (
        <Card 
          key={entry.student_id}
          className={`${entry.student_id === currentStudentId ? 'border-primary' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10">
                {getRankIcon(entry.rank)}
              </div>
              <Avatar>
                <AvatarFallback>
                  {entry.student_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{entry.student_name}</p>
                <p className="text-sm text-muted-foreground">{entry.branch}</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  {t('gamification.level')} {entry.level}
                </Badge>
                <p className="text-sm font-semibold">{entry.points} {t('gamification.points')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {currentUserRank && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-center">
              {t('gamification.rank')}: #{currentUserRank}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="overall">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">{t('gamification.overall')}</TabsTrigger>
          <TabsTrigger value="monthly">{t('gamification.monthly')}</TabsTrigger>
          <TabsTrigger value="branch">{t('gamification.branch')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="mt-6">
          {renderLeaderboard(overallLeaderboard)}
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          {renderLeaderboard(monthlyLeaderboard)}
        </TabsContent>

        <TabsContent value="branch" className="mt-6">
          {renderLeaderboard(branchLeaderboard)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
