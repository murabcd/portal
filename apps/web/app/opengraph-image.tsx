import SocialImage, {
  alt as sharedAlt,
  contentType as sharedContentType,
  size as sharedSize,
} from "@repo/lib/social-image";

export const alt = sharedAlt;
export const size = sharedSize;
export const contentType = sharedContentType;

export default function Image() {
  return SocialImage();
}
