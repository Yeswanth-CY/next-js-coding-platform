import { createServerSupabaseClient } from "@/lib/supabase/server"
import { RealTimeLeaderboard } from "@/components/real-time-leaderboard"
import { updateLeaderboardRankings } from "@/lib/code-execution-service"

// No need for frequent revalidation since we're using real-time updates
export const revalidate = 3600 // Fallback revalidation every hour

export default async function LeaderboardPage() {
  const supabase = createServerSupabaseClient()

  // Update leaderboard rankings on page load
  await updateLeaderboardRankings()

  // Fetch initial data for the leaderboard
  const { data: topUsers } = await supabase
    .from("user_statistics")
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url,
        country,
        rating
      )
    `)
    .order("total_points", { ascending: false })
    .limit(50)

  // Fetch top users by problems solved
  const { data: topSolvers } = await supabase
    .from("user_statistics")
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url,
        country,
        rating
      )
    `)
    .order("problems_solved", { ascending: false })
    .limit(50)

  // Fetch users with longest streaks
  const { data: topStreaks } = await supabase
    .from("user_statistics")
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url,
        country,
        rating
      )
    `)
    .order("streak", { ascending: false })
    .limit(10)

  // Get badge counts for each user
  const badgeCounts: Record<string, number> = {}

  if (topUsers) {
    for (const user of topUsers) {
      try {
        const { count } = await supabase.from("user_badges").select("*", { count: "exact" }).eq("user_id", user.user_id)

        badgeCounts[user.user_id] = count || 0
      } catch (error) {
        console.error(`Error getting badge count for user ${user.user_id}:`, error)
        badgeCounts[user.user_id] = 0
      }
    }
  }

  return (
    <RealTimeLeaderboard
      initialTopUsers={topUsers || []}
      initialTopSolvers={topSolvers || []}
      initialTopStreaks={topStreaks || []}
      initialBadgeCounts={badgeCounts}
    />
  )
}
