import { Menu } from 'lucide-react-native';

import ComingSoonScreen from '@/components/common/ComingSoonScreen';
import { colors } from '@/constants/colors';

export default function MoreTab() {
  return (
    <ComingSoonScreen
      eyebrow="YOUR SPACE"
      title="Saved, journal and profile"
      body="Saved prayers, journal, profile, settings and support will be connected in their dedicated build cycle."
      icon={<Menu size={30} color={colors.primary} />}
    />
  );
}
