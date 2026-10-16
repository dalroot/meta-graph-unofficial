"""
Instagram Media Creation, Codecs, and View Hierarchy Specification.
Models the exact hardware video/image encoding and layout tracks of Redmi Note 13.
"""

from typing import Dict, Any, List

INSTAGRAM_MEDIA_COMPOSER_SPEC: Dict[str, Any] = {
    "creation_activity": "com.instagram.modal.ModalActivity",
    "view_hierarchy": {
        "story_font_editor": "com.instagram.ui.text.ConstrainedEditText",
        "caption_input": "com.instagram.ui.widget.textview.IgAutoCompleteTextView",
        "search_input": "com.instagram.ui.text.backinterceptedittext.BackInterceptEditText",
        "track_containers": [
            "clips_editor_sticky_tracks_container",
            "clips_editor_video_track_recyclerview"
        ]
    },
    "hardware_codecs": {
        "video_encode": "c2.qti.hevc.encoder", # Qualcomm hardware H.265 / HEVC
        "video_decode": "c2.qti.hevc.decoder",
        "image_encode": "c2.qti.heic.encoder", # Qualcomm hardware HEIC for Story still images
        "audio_encode": "c2.android.aac.encoder", # 44.1kHz stereo
        "audio_decode": "c2.android.aac.decoder"
    },
    "upload_protocols": {
        "photo": "/rupload_igphoto/{upload_id}",
        "video": "/rupload_igvideo/{upload_id}",
        "configure_feed": "/api/v1/media/configure/",
        "configure_story": "/api/v1/media/configure_to_story/",
        "configure_clips": "/api/v1/media/configure_to_clips/"
    }
}
