import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileText,
  Heart,
  List,
  Sparkles,
  UserRound,
} from 'lucide-react-native';

const NAVY = '#061B50';
const BLUE = '#0D43B6';
const BLUE_SOFT = '#EAF3FF';
const GOLD = '#F4B400';
const GOLD_SOFT = '#FFF3C8';
const MUTED = '#60739A';
const BORDER = '#E6EBF2';
const PAPER = '#FFFEFB';
const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const PAGES = [
  { title: 'Turn Scripture\nInto Prayer', description: 'Take a Bible verse, and turn it into\na meaningful prayer in seconds.' },
  { title: 'Pray Through\nEvery Verse', description: 'Go step by step — from book to chapter\nto verse — and turn every verse into prayer.' },
  { title: 'Pray Together', description: 'Join the Prayer Wall — share your\nprayers, be encouraged, and pray for\nothers around the world.' },
] as const;

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Image source={require('../../../assets/images/PIV-logo.png')} resizeMode="contain" style={[styles.brandLogo, compact && styles.brandLogoCompact]} />;
}

function ScriptureToPrayerVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.scriptureStage, compact && styles.scriptureStageCompact]}>
      <View style={styles.blueBlob} />
      <View style={styles.softDot} />
      <View style={styles.goldGlow} />
      <View style={[styles.paperCard, styles.scriptureCard]}>
        <Text style={styles.cardReference}>Philippians 4:6</Text>
        <Text style={styles.scriptureText}>“Do not be anxious{`\n`}about anything, but in{`\n`}everything by prayer{`\n`}and petition...”</Text>
        <Text style={styles.scriptureMeta}>PHILIPPIANS 4:6</Text>
      </View>
      <Svg width={132} height={116} viewBox="0 0 132 116" style={styles.curvedArrow}>
        <Path d="M18 18 C72 18 96 42 94 84" stroke="#F5BE26" strokeWidth="6" strokeLinecap="round" fill="none" />
        <Path d="M77 72 L94 92 L108 69" stroke="#F5BE26" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M116 44 L123 37" stroke="#F5BE26" strokeWidth="3" strokeLinecap="round" />
        <Path d="M120 56 L130 54" stroke="#F5BE26" strokeWidth="3" strokeLinecap="round" />
      </Svg>
      <View style={[styles.paperCard, styles.prayerCard]}>
        <View style={styles.prayerLabelRow}>
          <View style={styles.prayerHandsBubble}><Text style={styles.prayerHands}>🙏</Text></View>
          <View style={styles.prayerLabel}><Text style={styles.prayerLabelText}>YOUR PRAYER</Text></View>
        </View>
        <Text style={styles.prayerText}>Lord, help me to bring{`\n`}every concern to You.{`\n`}Teach me to trust You{`\n`}in all things, and give me{`\n`}Your peace today.</Text>
      </View>
      <View style={styles.leafBranch}>
        <View style={[styles.leaf, styles.leafOne]} /><View style={[styles.leaf, styles.leafTwo]} /><View style={[styles.leaf, styles.leafThree]} /><View style={[styles.leaf, styles.leafFour]} />
      </View>
    </View>
  );
}

const FLOW_STEPS = [
  { title: 'Book', subtitle: 'Choose a book of the Bible', Icon: BookOpen },
  { title: 'Chapter', subtitle: 'Select a chapter', Icon: FileText },
  { title: 'Verse', subtitle: 'Pick a verse', Icon: List },
  { title: 'Prayer', subtitle: 'Get a guided prayer', Icon: Sparkles },
] as const;

function VerseFlowVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.flowStage, compact && styles.flowStageCompact]}>
      {FLOW_STEPS.map(({ title, subtitle, Icon }, index) => {
        const isPrayer = index === FLOW_STEPS.length - 1;
        return <View key={title} style={styles.flowGroup}>
          <View style={[styles.flowCard, isPrayer && styles.flowPrayerCard]}>
            <View style={[styles.flowIconBox, isPrayer && styles.flowIconGold]}><Icon size={27} color={isPrayer ? '#B67C00' : '#0861C7'} strokeWidth={2} /></View>
            <View style={styles.flowCopy}><Text style={styles.flowTitle}>{title}</Text><Text style={styles.flowSubtitle}>{subtitle}</Text></View>
            <ChevronRight size={22} color="#53647F" strokeWidth={2} />
          </View>
          {index < FLOW_STEPS.length - 1 ? <View style={styles.flowConnector}><Text style={styles.flowArrow}>↓</Text></View> : null}
        </View>;
      })}
    </View>
  );
}

function Avatar({ style }: { style?: object }) {
  return <View style={[styles.avatar, style]}><UserRound size={29} color="#7F9FD4" strokeWidth={1.8} /></View>;
}

function CommunityCard({ name, time, prayer, count, style }: { name: string; time: string; prayer: string; count: number; style?: object }) {
  return <View style={[styles.communityCard, style]}>
    <View style={styles.communityHeader}><Avatar /><View style={styles.communityHeaderCopy}><Text style={styles.communityName}>{name}</Text><Text style={styles.communityTime}>{time}</Text></View></View>
    <Text style={styles.communityPrayer}>{prayer}</Text>
    <View style={styles.communityActions}><View style={styles.metaRow}><Heart size={18} color="#FF493D" fill="#FF493D" /><Text style={styles.metaText}>{count}</Text></View><View style={styles.metaRow}><Text style={styles.prayHandsSmall}>🙏</Text><Text style={styles.prayText}>Pray</Text></View></View>
  </View>;
}

function CommunityVisual({ compact }: { compact: boolean }) {
  return <View style={[styles.communityStage, compact && styles.communityStageCompact]}>
    <View style={styles.communityGlow} /><View style={styles.goldArc} />
    <View style={styles.globeWrap}>
      <Svg width="100%" height="100%" viewBox="0 0 320 230">
        <Circle cx="160" cy="178" r="146" fill="#E3EEFF" />
        <Path d="M24 168 C75 125 111 122 151 142 C198 166 222 116 294 157" stroke="#BBD2F6" strokeWidth="3" fill="none" />
        <Path d="M68 105 C90 121 94 139 80 158 C65 178 74 198 102 217" stroke="#BBD2F6" strokeWidth="3" fill="none" />
        <Path d="M214 99 C195 119 197 139 221 151 C245 163 242 190 226 213" stroke="#BBD2F6" strokeWidth="3" fill="none" />
        <Path d="M40 194 C104 159 190 160 288 202" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 6" fill="none" opacity="0.9" />
      </Svg>
      <Avatar style={styles.globeAvatarOne} /><Avatar style={styles.globeAvatarTwo} /><Avatar style={styles.globeAvatarThree} />
    </View>
    <CommunityCard name="Sarah M." time="2h ago" prayer={'Praying for peace and\nhealing for my family. 🙏'} count={24} style={styles.communityOne} />
    <CommunityCard name="David K." time="5h ago" prayer={'Lord, give me strength\ntoday. 💙'} count={18} style={styles.communityTwo} />
  </View>;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;
  const compact = height < 760;
  useEffect(() => { opacity.setValue(0); translate.setValue(7); Animated.parallel([Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(translate, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true })]).start(); }, [opacity, page, translate]);
  function finish() { router.replace('/(auth)/login'); }
  function next() { if (page === 2) { finish(); return; } setPage((value) => value + 1); }
  return <SafeAreaView style={styles.safeArea}>
    <StatusBar style="dark" />
    <View style={styles.container}>
      <View style={styles.decorTopLeft} /><View style={styles.decorBottomRight} />
      <View style={styles.topRow}>{page < 2 ? <BrandLogo compact={compact} /> : <View />}<Pressable onPress={finish} hitSlop={16} style={styles.skipButton}><Text style={styles.skipText}>Skip</Text></Pressable></View>
      <Animated.View style={[styles.slideContent, { opacity, transform: [{ translateY: translate }] }]}>
        <Text style={[styles.title, page === 2 && styles.titleCommunity, compact && styles.titleCompact]}>{PAGES[page].title}</Text>
        <Text style={[styles.description, compact && styles.descriptionCompact]}>{PAGES[page].description}</Text>
        <View style={styles.visualArea}>{page === 0 ? <ScriptureToPrayerVisual compact={compact} /> : null}{page === 1 ? <VerseFlowVisual compact={compact} /> : null}{page === 2 ? <CommunityVisual compact={compact} /> : null}</View>
      </Animated.View>
      <View style={styles.bottomArea}><View style={styles.dotsRow}>{[0,1,2].map((index)=><View key={index} style={[styles.dot,index===page&&styles.dotActive]} />)}</View><Pressable accessibilityRole="button" onPress={next} style={({pressed})=>[styles.primaryButton,pressed&&styles.primaryButtonPressed]}><Text style={styles.primaryButtonText}>{page===2?'Get Started':'Next'}</Text>{page===0?<ArrowRight size={22} color="#FFFFFF" strokeWidth={2}/>:null}</Pressable></View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:PAPER},container:{flex:1,paddingHorizontal:24,paddingBottom:16,overflow:'hidden'},decorTopLeft:{position:'absolute',top:-125,left:-145,width:290,height:290,borderRadius:145,backgroundColor:'#FFF7DF',opacity:.82},decorBottomRight:{position:'absolute',right:-145,bottom:-150,width:330,height:330,borderRadius:165,backgroundColor:'#FFF1BF',opacity:.58},topRow:{height:112,alignItems:'center',justifyContent:'center'},brandLogo:{width:132,height:96},brandLogoCompact:{width:104,height:74},skipButton:{position:'absolute',right:0,top:8,minWidth:68,minHeight:46,alignItems:'flex-end',justifyContent:'center'},skipText:{color:'#405779',fontSize:17,fontWeight:'600'},slideContent:{flex:1,alignItems:'center'},title:{color:NAVY,fontFamily:SERIF_FONT,fontSize:38,lineHeight:42,fontWeight:'700',textAlign:'center',letterSpacing:-.7},titleCommunity:{marginTop:10,fontSize:41,lineHeight:46},titleCompact:{fontSize:31,lineHeight:34},description:{marginTop:17,color:MUTED,fontSize:17,lineHeight:24,textAlign:'center',maxWidth:350},descriptionCompact:{marginTop:10,fontSize:14,lineHeight:19},visualArea:{flex:1,width:'100%',alignItems:'center',justifyContent:'center',minHeight:330},
  scriptureStage:{width:'100%',height:400,position:'relative'},scriptureStageCompact:{height:330,transform:[{scale:.88}]},blueBlob:{position:'absolute',width:270,height:270,borderRadius:135,left:15,top:62,backgroundColor:'#EAF2FF'},softDot:{position:'absolute',width:58,height:58,borderRadius:29,right:14,top:95,backgroundColor:'#F4F8FF'},goldGlow:{position:'absolute',width:210,height:170,borderRadius:100,right:8,bottom:24,backgroundColor:'#FFF5D8',opacity:.72},paperCard:{position:'absolute',backgroundColor:'#FFFFFF',borderRadius:22,shadowColor:'#23345D',shadowOffset:{width:0,height:10},shadowOpacity:.14,shadowRadius:18,elevation:7},scriptureCard:{width:238,left:8,top:32,paddingHorizontal:22,paddingTop:22,paddingBottom:19,transform:[{rotate:'-6deg'}]},prayerCard:{width:238,right:5,bottom:14,paddingHorizontal:22,paddingTop:18,paddingBottom:22,transform:[{rotate:'4deg'}]},cardReference:{color:NAVY,fontFamily:SERIF_FONT,fontSize:19,fontWeight:'700'},scriptureText:{marginTop:14,color:'#415574',fontSize:16,lineHeight:22},scriptureMeta:{marginTop:17,color:'#8EA3C4',fontSize:10,fontWeight:'800',letterSpacing:2.3},curvedArrow:{position:'absolute',right:42,top:146,zIndex:7},prayerLabelRow:{flexDirection:'row',alignItems:'center',gap:8},prayerHandsBubble:{width:37,height:37,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:'#FFF0B8'},prayerHands:{fontSize:18},prayerLabel:{borderRadius:999,backgroundColor:'#FFF4CC',paddingHorizontal:11,paddingVertical:6},prayerLabelText:{color:'#A76F00',fontSize:10,fontWeight:'900',letterSpacing:.9},prayerText:{marginTop:14,color:NAVY,fontFamily:SERIF_FONT,fontSize:17,lineHeight:22,fontWeight:'600'},leafBranch:{position:'absolute',left:-26,bottom:-18,width:112,height:120},leaf:{position:'absolute',width:16,height:48,borderRadius:16,backgroundColor:'#CFE0F8',transform:[{rotate:'42deg'}]},leafOne:{left:24,top:8},leafTwo:{left:47,top:28,backgroundColor:'#DDE9F9'},leafThree:{left:14,top:55,backgroundColor:'#F7E7B6'},leafFour:{left:48,top:73,backgroundColor:'#F5DE9C'},
  flowStage:{width:'100%',paddingTop:16},flowStageCompact:{paddingTop:0,transform:[{scale:.9}]},flowGroup:{alignItems:'center'},flowCard:{width:'100%',minHeight:76,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:BORDER,borderRadius:20,backgroundColor:'#FFFFFF',paddingHorizontal:16,shadowColor:'#203A70',shadowOffset:{width:0,height:6},shadowOpacity:.07,shadowRadius:14,elevation:3},flowPrayerCard:{borderColor:'#F1CB68',backgroundColor:'#FFFBF0'},flowIconBox:{width:55,height:55,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:BLUE_SOFT},flowIconGold:{backgroundColor:GOLD_SOFT},flowCopy:{flex:1,marginLeft:16},flowTitle:{color:NAVY,fontFamily:SERIF_FONT,fontSize:19,fontWeight:'700'},flowSubtitle:{marginTop:3,color:MUTED,fontSize:13},flowConnector:{height:30,alignItems:'center',justifyContent:'center'},flowArrow:{color:GOLD,fontSize:28,lineHeight:29,fontWeight:'600'},
  communityStage:{width:'100%',height:430,position:'relative',overflow:'hidden'},communityStageCompact:{height:355,transform:[{scale:.88}]},communityGlow:{position:'absolute',width:330,height:330,borderRadius:165,left:5,bottom:-42,backgroundColor:'#EEF4FF'},goldArc:{position:'absolute',width:330,height:330,borderRadius:165,left:4,bottom:-38,borderWidth:8,borderColor:'#FFE8A9',opacity:.85},communityCard:{position:'absolute',width:245,borderRadius:22,backgroundColor:'#FFFFFF',padding:17,shadowColor:'#263A67',shadowOffset:{width:0,height:8},shadowOpacity:.14,shadowRadius:17,elevation:7,zIndex:5},communityOne:{top:6,left:8},communityTwo:{top:160,right:0},communityHeader:{flexDirection:'row',alignItems:'center',gap:10},communityHeaderCopy:{flex:1},avatar:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center',backgroundColor:'#DCE9FF',borderWidth:3,borderColor:'#FFFFFF'},communityName:{color:NAVY,fontSize:17,fontWeight:'800'},communityTime:{marginTop:2,color:'#8C9CB6',fontSize:12},communityPrayer:{marginTop:13,color:'#14254B',fontSize:16,lineHeight:22},communityActions:{marginTop:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},metaRow:{flexDirection:'row',alignItems:'center',gap:6},metaText:{color:'#657796',fontSize:14,fontWeight:'700'},prayHandsSmall:{fontSize:15},prayText:{color:'#0D55D6',fontSize:15,fontWeight:'800'},globeWrap:{position:'absolute',width:340,height:245,left:-4,bottom:-22},globeAvatarOne:{position:'absolute',left:36,top:94},globeAvatarTwo:{position:'absolute',left:64,bottom:14},globeAvatarThree:{position:'absolute',right:33,bottom:18},
  bottomArea:{width:'100%',paddingTop:2},dotsRow:{height:34,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:11},dot:{width:11,height:11,borderRadius:6,backgroundColor:'#CBD5E7'},dotActive:{backgroundColor:BLUE},primaryButton:{minHeight:64,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:15,borderRadius:32,backgroundColor:BLUE,shadowColor:'#0B44B2',shadowOffset:{width:0,height:9},shadowOpacity:.2,shadowRadius:16,elevation:7},primaryButtonPressed:{opacity:.92,transform:[{scale:.995}]},primaryButtonText:{color:'#FFFFFF',fontSize:20,fontWeight:'700'}
});
