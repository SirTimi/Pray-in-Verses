import { UsersRound } from 'lucide-react-native';

import ComingSoonScreen from '@/components/common/ComingSoonScreen';
import { colors } from '@/constants/colors';

export default function CommunityTab() {
  return (
    <ComingSoonScreen
      eyebrow="COMMUNITY"
      title="Prayer Wall"
      body="The full Prayer Wall, request detail, comments and request creation flow are the next community build."
      icon={<UsersRound size={30} color={colors.primary} />}
    />
  );
}
