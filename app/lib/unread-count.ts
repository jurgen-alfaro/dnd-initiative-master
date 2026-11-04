/** An unread badge's text: the count, capped so it fits the badge. */
export function formatUnreadCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}
