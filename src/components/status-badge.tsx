import { labelFor, toneFor, type LabeledOption } from "@/lib/options";
import { Badge } from "./ui";

export function StatusBadge<T extends string>({
  options,
  value,
}: {
  options: LabeledOption<T>[];
  value: T;
}) {
  return <Badge tone={toneFor(options, value)}>{labelFor(options, value)}</Badge>;
}
