import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { ServiceType } from "~/types/services";
import { getPressignetUrl } from "./s3";

export type HistoryItem = {
    id: string;
    title: string;
    voice: string | null;
    audioUrl: string | null;
    time: string;
    date: string;
    service: ServiceType;
}

export async function getHistoryItems(service: ServiceType): Promise<HistoryItem[]> {
    const session = await auth();

    if (!session) {
        return [];
    }

    try {
        const audioClips = await db.generatedAudioClip.findMany({
            where: {
                userId: session.user.id,
                s3Key: { not: null },
                service: service,
            },
            select: {
                id: true,
                text: true,
                voice: true,
                s3Key: true,
                createdAt: true,
                service: true,
            },
            take: 10,
            orderBy: {
                createdAt: "desc",
            },
        });

        const historyItems = await Promise.all(
            audioClips.map(async (clip) => {
                let title = clip.text || "Generated Audio";
                if (clip.service === "seedvc") {
                    title = "Voice conversion to " + clip.voice;
                } else if (clip.text !== null) {
                    title = clip.text.length > 20 ? clip.text.slice(0, 20) + "..." : clip.text;
                }

                const audioUrl = clip.s3Key ? await getPressignetUrl({ key: clip.s3Key }) : null;

                return {
                    id: clip.id,
                    title,
                    voice: clip.voice,
                    audioUrl,
                    time: new Date(clip.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    date: new Date(clip.createdAt).toLocaleDateString(),
                    service: clip.service as ServiceType,
                };
            })
        );

        return historyItems;
    } catch (error) {
        console.error("Error fetching history items:", error);
        return [];
    }
}