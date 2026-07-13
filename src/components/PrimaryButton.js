import PixelButton from "./PixelButton";

export default function PrimaryButton({ title, onPress, disabled, color }) {
  return <PixelButton title={title} onPress={onPress} disabled={disabled} color={color} />;
}
