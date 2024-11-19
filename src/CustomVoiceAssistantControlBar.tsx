import { Track } from "livekit-client";
import * as React from "react";
import { MediaDeviceMenu } from "../node_modules/@livekit/components-react/src/prefabs/MediaDeviceMenu"; // 完整導入 MediaDeviceMenu
import { DisconnectButton } from "../node_modules/@livekit/components-react/src/components/controls/DisconnectButton"; // 完整導入 DisconnectButton
import { TrackToggle } from "../node_modules/@livekit/components-react/src/components/controls/TrackToggle"; // 完整導入 TrackToggle
import {
  useLocalParticipant,
  useLocalParticipantPermissions,
  usePersistentUserChoices,
} from "../node_modules/@livekit/components-react/src/hooks"; // 完整導入 hooks
import { mergeProps } from "../node_modules/@livekit/components-react/src/utils"; // 完整導入 utils
import { BarVisualizer } from "../node_modules/@livekit/components-react/src/components"; // 完整導入 BarVisualizer
import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";


/** @beta */
export type CustomVoiceAssistantControlBarControls = {
  microphone?: boolean;
  leave?: boolean;
};

/** @beta */
export interface CustomVoiceAssistantControlBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  controls?: CustomVoiceAssistantControlBarControls;
  saveUserChoices?: boolean;
}

/**
 * Custom Voice Assistant Control Bar
 */
export function CustomVoiceAssistantControlBar({
  controls,
  saveUserChoices = true,
  onDeviceError,
  ...props
}: CustomVoiceAssistantControlBarProps) {
    const visibleControls = { leave: true, microphone: true, ...controls };

    const localPermissions = useLocalParticipantPermissions();
    const { microphoneTrack, localParticipant } = useLocalParticipant();
  
    const micTrackRef: TrackReferenceOrPlaceholder = React.useMemo(() => {
      return {
        participant: localParticipant,
        source: Track.Source.Microphone,
        publication: microphoneTrack,
      };
    }, [localParticipant, microphoneTrack]);
  
    if (!localPermissions) {
      visibleControls.microphone = false;
    } else {
      visibleControls.microphone ??= localPermissions.canPublish;
    }
  
    const htmlProps = mergeProps({ className: 'lk-agent-control-bar' }, props);
  
    const { saveAudioInputEnabled, saveAudioInputDeviceId } = usePersistentUserChoices({
      preventSave: !saveUserChoices,
    });
  
    const microphoneOnChange = React.useCallback(
      (enabled: boolean, isUserInitiated: boolean) => {
        if (isUserInitiated) {
          saveAudioInputEnabled(enabled);
        }
      },
      [saveAudioInputEnabled],
    );
  
    return (
      <div {...htmlProps}>
        {visibleControls.microphone && (
          <div className="lk-button-group">
            <TrackToggle
              source={Track.Source.Microphone}
              showIcon={true}
              onChange={microphoneOnChange}
              onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Microphone, error })}
            >
              <BarVisualizer trackRef={micTrackRef} barCount={7} options={{ minHeight: 5 }} />
            </TrackToggle>
            <div className="lk-button-group-menu">
              <MediaDeviceMenu
                kind="audioinput"
                onActiveDeviceChange={(_kind, deviceId) => saveAudioInputDeviceId(deviceId ?? '')}
              />
            </div>
          </div>
        )}
  
        {visibleControls.leave && <DisconnectButton>{'Disconnect'}</DisconnectButton>}
        <StartMediaButton />
      </div>
    );
  }
  