import { Bell, CalendarClock, CheckCheck, FileClock, Info, UserRound } from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp, t } from "@/context/app-context";
import { getLocalizedNotifications } from "@/i18n/scheme-translations";
import type { AppNotification } from "@/types/app";
import { cn } from "@/lib/utils";

const icons = {
  scheme: Bell,
  deadline: CalendarClock,
  profile: UserRound,
  update: FileClock,
};

export function NotificationsPage() {
  const { notifications, markRead, language } = useApp();
  const localizedNotifications = getLocalizedNotifications(notifications, language);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title={t(language, "Notifications")}
          description={t(language, "notifications_desc")}
          actions={
            <Button variant="outline" onClick={() => markRead()}>
              <CheckCheck />
              {t(language, "Mark all read")}
            </Button>
          }
        />
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              {t(language, "All")} ({localizedNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              {t(language, "Unread")} ({localizedNotifications.filter((n) => !n.read).length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4 space-y-3">
            {localizedNotifications.map((n) => (
              <NotificationCard key={n.id} item={n} onRead={() => markRead(n.id)} />
            ))}
          </TabsContent>
          <TabsContent value="unread" className="mt-4 space-y-3">
            {localizedNotifications
              .filter((n) => !n.read)
              .map((n) => (
                <NotificationCard key={n.id} item={n} onRead={() => markRead(n.id)} />
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function NotificationCard({
  item,
  onRead,
}: {
  item: AppNotification;
  onRead: () => void;
}) {
  const Icon = icons[item.type];
  return (
    <button
      onClick={onRead}
      className={cn(
        "flex w-full gap-4 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:border-primary/40",
        !item.read && "border-l-4 border-l-primary bg-secondary/25",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
        <Icon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <b className="text-sm sm:text-base">{item.title}</b>
          {!item.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{item.detail}</span>
        <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="size-3" />
          {item.time}
        </span>
      </span>
    </button>
  );
}
