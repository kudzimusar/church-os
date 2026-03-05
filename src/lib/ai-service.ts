import { formatInTimeZone } from "date-fns-tz";

export const AIService = {
    generateHeroMessage: (streak: number, completed: number, total: number = 90) => {
        const percentage = Math.round((completed / total) * 100) || 0;

        let message = "Welcome! Let's begin your 90 Days of Transformation today.";

        if (streak > 0) {
            if (streak >= 7) {
                message = `Incredible focus! You are on a ${streak}-day streak. The Spirit is moving.`;
            } else if (streak >= 3) {
                message = `Welcome back! A solid ${streak}-day streak. Let's build on this momentum.`;
            } else {
                message = `Welcome back! You're on a ${streak}-day streak. Let's focus on today's declaration.`;
            }
        } else if (completed > 0) {
            message = "Welcome back! Let's restart your streak today and dive into the Word.";
        }

        if (percentage >= 10 && percentage < 100) {
            message += ` You are ${percentage}% through the journey.`;
        } else if (percentage === 100) {
            message = "Congratulations! You have completed the 90 Days of Transformation.";
        }

        return message;
    },

    askBibleChat: async (scripture: string, question: string) => {
        // Simulated Gemini API binding
        // In a real scenario, this connects to the Gemini endpoint
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                resolve(`Regarding "${scripture}": Here is an AI-generated reflection exploring the context of your question: "${question}".\n\nThe passage emphasizes God's enduring faithfulness. (This is a mock response preparing for Gemini API integration).`);
            }, 1500);
        });
    },

    chatWithGlobalAssistant: async (userRole: string, userName: string, query: string) => {
        // [FUTURE AI INTEGRATION NOTE]
        // When real Gemini API is integrated, if userRole === 'admin', query the `member_analytics`, 
        // `soap_entries`, and `prayer_requests` tables first. Serialize that data into a hidden 
        // prompt context (e.g., "Here is the church data: ... Analyze and respond to: query").
        // This will allow true real-time detection of dwindles, growth, and discrepancies.

        return new Promise<string>((resolve) => {
            setTimeout(() => {
                const isAdmin = userRole === 'admin' || userRole === 'leader' || userRole === 'pastor';
                const lowerQuery = query.toLowerCase();

                if (isAdmin) {
                    if (lowerQuery.includes('growth') || lowerQuery.includes('attendance') || lowerQuery.includes('analytics') || lowerQuery.includes('summary')) {
                        resolve(`📊 Hello ${userName}. Based on 30-day cross-referenced analytics:\n\n📈 +15% engagement in daily devotions.\n👥 Small Group sign-ups grew by 8 members.\n⚠️ Discrepancy Alert: 12 active app users show irregular physical Sunday attendance.\n\nRecommended Action:\nReach out to the 12 irregular attendees directly from the Pastoral Care Hub on your dashboard. Use their devotion activity as a warm touchpoint.`);
                    } else if (lowerQuery.includes('prayer') || lowerQuery.includes('care') || lowerQuery.includes('alerts')) {
                        resolve(`🚨 Pastoral Care Status:\n\n🙏 5 Unresolved prayer requests in the last 48 hours.\n💬 2 members flagged by the system for counseling follow-ups based on significant "Stewardship Log" changes.\n📉 Ministry Roles: Currently short 3 volunteers for "Children's Ministry".\n\nWould you like me to aggregate these into a Care Team email draft?`);
                    } else {
                        resolve(`Hello ${userName}. As an Admin Assistant, I am constantly monitoring church health.\n\nRegarding: "${query}"\nNo severe discrepancies found right now. What specific data slice (growth, programs, user roles, due dates) would you like me to aggregate for you?`);
                    }
                } else {
                    resolve(`Hello ${userName}. I am your Spiritual Assistant.\n\nRegarding: "${query}"\n\nThe Word tells us to continually seek wisdom. If you have questions about specific verses, want to know how to connect with the church, or need me to check your recent devotion streak, just ask! Keep building healthy habits!`);
                }
            }, 1500);
        });
    }
};
