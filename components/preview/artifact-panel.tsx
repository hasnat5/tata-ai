"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import {
    FileText,
    Palette,
    Building2,
    Users,
    Film,
    MapPin,
    Shirt,
    X,
    Clapperboard,
    Image as ImageIcon,
    Video,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    OverviewArtifact,
    AestheticArtifact,
    BrandArtifact,
    CharacterArtifact,
    ScriptArtifact,
    LocationArtifact,
    AttireArtifact,
    PreprocessingArtifact,
} from "./artifacts";
import { ThumbnailsArtifact } from "./artifacts/thumbnails-artifact";
import { VideosArtifact } from "./artifacts/videos-artifact";
import { FinalVideoArtifact } from "./artifacts/final-video-artifact";

export function ArtifactPanel() {
    const { currentArtifact, setCurrentArtifact, setScriptContext } =
        useAppStore();

    if (!currentArtifact) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground p-4">
                <p className="text-sm text-center">
                    Select an item from the checklist to see details
                </p>
            </div>
        );
    }

    const getTitle = () => {
        switch (currentArtifact.type) {
            case "overview":
                return "Project Overview";
            case "aesthetic":
                return "Art Style & Aesthetic";
            case "brand":
                return "Brand Guidelines";
            case "character":
                return "Characters";
            case "script":
                return "Script & Scenes";
            case "location":
                return "Locations";
            case "attire":
                return "Character Attires";
            case "preprocessing":
                return "Preprocessing";
            case "thumbnails":
                return "Scene Thumbnails";
            case "videos":
                return "Generated Videos";
            case "final_video":
                return "Final Video";
            default:
                return "Preview";
        }
    };

    const iconMap: Record<
        string,
        React.ComponentType<{ className?: string }>
    > = {
        overview: FileText,
        aesthetic: Palette,
        brand: Building2,
        character: Users,
        script: Film,
        location: MapPin,
        attire: Shirt,
        preprocessing: Clapperboard,
        thumbnails: ImageIcon,
        videos: Video,
        final_video: Download,
    };

    const Icon = iconMap[currentArtifact.type] || FileText;

    // Handle navigation within artifacts
    const handleSelectCharacter = (id: string) => {
        setCurrentArtifact({ type: "character", data: id });
    };

    const handleSelectLocation = (id: string) => {
        setCurrentArtifact({ type: "location", data: id });
    };

    const handleSelectAttire = (id: string) => {
        setCurrentArtifact({ type: "attire", data: id });
    };

    const handleSelectScene = (id: string) => {
        setCurrentArtifact({ type: "thumbnails", data: id });
    };

    const handleSelectVideoScene = (id: string) => {
        setCurrentArtifact({ type: "videos", data: id });
    };

    const handleBack = () => {
        setCurrentArtifact({ type: currentArtifact.type, data: null });
    };

    // For location/attire detail views, go back to preprocessing
    const handleBackToPreprocessing = () => {
        setCurrentArtifact({ type: "preprocessing", data: null });
    };

    const renderArtifact = () => {
        switch (currentArtifact.type) {
            case "overview":
                return <OverviewArtifact />;
            case "aesthetic":
                return <AestheticArtifact />;
            case "brand":
                return <BrandArtifact />;
            case "character":
                return (
                    <CharacterArtifact
                        characterId={currentArtifact.data as string | undefined}
                        onSelectCharacter={handleSelectCharacter}
                        onBack={handleBack}
                    />
                );
            case "script":
                return <ScriptArtifact onAddContext={setScriptContext} />;
            case "location":
                return (
                    <LocationArtifact
                        locationId={currentArtifact.data as string | undefined}
                        onSelectLocation={handleSelectLocation}
                        onBack={handleBackToPreprocessing}
                    />
                );
            case "attire":
                return (
                    <AttireArtifact
                        attireId={currentArtifact.data as string | undefined}
                        onSelectAttire={handleSelectAttire}
                        onBack={handleBackToPreprocessing}
                    />
                );
            case "preprocessing":
                return <PreprocessingArtifact />;
            case "thumbnails":
                return (
                    <ThumbnailsArtifact
                        sceneId={currentArtifact.data as string | undefined}
                        onSelectScene={handleSelectScene}
                        onBack={handleBack}
                    />
                );
            case "videos":
                return (
                    <VideosArtifact
                        sceneId={currentArtifact.data as string | undefined}
                        onSelectScene={handleSelectVideoScene}
                        onBack={handleBack}
                    />
                );
            case "final_video":
                return <FinalVideoArtifact />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header - compact */}
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">{getTitle()}</h3>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentArtifact(null)}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-3">{renderArtifact()}</div>
        </div>
    );
}
