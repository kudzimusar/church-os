"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MemberForm } from "./forms/MemberForm";
import { EventForm } from "./forms/EventForm";
import { PrayerForm } from "./forms/PrayerForm";
import { MinistryForm } from "./forms/MinistryForm";
import { ReportForm } from "./forms/ReportForm";
import { BibleStudyGroupForm } from "./forms/BibleStudyGroupForm";
import { Users, Calendar, Heart, BookOpen, FileText, MessagesSquare } from "lucide-react";

export type QuickActionType = "member" | "event" | "prayer" | "ministry" | "report" | "bible_study";

interface QuickActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: QuickActionType | null;
    initialData?: any;
}

const ACTION_CONFIG = {
    member: { title: "New Member", icon: Users, color: "text-violet-400", desc: "Integrate a new member into the church ecosystem.", component: MemberForm },
    event: { title: "Church Event", icon: Calendar, color: "text-blue-400", desc: "Schedule services, Bible studies, or special events.", component: EventForm },
    prayer: { title: "Prayer Request", icon: Heart, color: "text-red-400", desc: "Submit a request for intercessory tracking.", component: PrayerForm },
    ministry: { title: "Ministry Role", icon: BookOpen, color: "text-emerald-400", desc: "Recruit members into specialized ministry teams.", component: MinistryForm },
    report: { title: "AI Report", icon: FileText, color: "text-indigo-400", desc: "Synthesize current data into an intelligence briefing.", component: ReportForm },
    bible_study: { title: "Bible Study Group", icon: MessagesSquare, color: "text-amber-400", desc: "Manage spiritual growth and Bible study circles.", component: BibleStudyGroupForm },
};

export function QuickActionModal({ isOpen, onClose, type, initialData }: QuickActionModalProps) {
    if (!type) return null;
    const config = ACTION_CONFIG[type];
    const FormComponent = config.component;
    const Icon = config.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card border-border text-foreground rounded-3xl max-w-lg shadow-2xl transition-colors">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-2xl bg-muted flex items-center justify-center ${config.color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-foreground">
                                {initialData ? `Edit ${config.title}` : `Create ${config.title}`}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs font-medium">
                                {config.desc}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <FormComponent onSuccess={onClose} initialData={initialData} />
            </DialogContent>
        </Dialog>
    );
}
