import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Image, View } from "react-native";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { hideAsync } from "expo-splash-screen";
import { Asset } from "expo-asset";

type Props = {
  onComplete: (status: boolean) => void;
};

export function Splash({ onComplete }: Props) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [isSplashHidden, setIsSplashHidden] = useState(false);
  const lastStatus = useRef<AVPlaybackStatus | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await Asset.loadAsync(require("../../assets/images/shk.mp4"));
        await hideAsync();
        setIsSplashHidden(true);
      } catch (e) {
        console.error("Error preparing splash screen:", e);
        setVideoFailed(true);
        onComplete(false);
      }
    }

    prepare();

    const timer = setTimeout(() => {
      onComplete(true);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, []);

  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        onComplete(true);
      }
    }
    lastStatus.current = status;
  }

  function onError(error: string) {
    console.error("Video loading error:", error);
    setVideoFailed(true);
    onComplete(false);
  }

  if (videoFailed) {
    return (
      <Image
        style={StyleSheet.absoluteFillObject}
        source={require("../../assets/images/jhk.png")}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {isSplashHidden && (
        <Video
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          source={require("../../assets/images/shk.mp4")}
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onError={onError}
          shouldPlay={true}
        />
      )}
    </View>
  );
}
