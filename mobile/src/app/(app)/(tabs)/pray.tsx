import { Sparkles } from 'lucide-react-native';

import ComingSoonScreen from '@/components/common/ComingSoonScreen';
import { colors } from '@/constants/colors';

export default function PrayTab() {
  return (
    <ComingSoonScreen
      eyebrow="PRAYER"
      title="Pray through Scripture"
      body="Prayer detail and the guided prayer experience are the next focused build after the Scripture browsing flow is accepted."
      icon={<Sparkles size={30} color={colors.primary} />}
    />
  );
}
