import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  Image, 
  ImageBackground, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  FlatList, 
  TextInput,
  Dimensions,
  Alert,
  Animated,
  ScrollView,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MOBILE_WIDTH = 375; // iPhone standard width
const MOBILE_HEIGHT = 812; // iPhone standard height (9:16 ratio)

const QUESTIONS = [
  {
    prompt: '1. How do you prefer to spend your free time?',
    options: [
      { key: 'A', label: 'Socializing with a large group of friends' },
      { key: 'B', label: 'Enjoying time alone/with a few friends' },
      { key: 'C', label: 'Engaging in a competitive challenge' },
      { key: 'D', label: 'I have no free time! I am always busy' },
    ],
  },
  {
    prompt: '2. When faced with a problem, you tend to:',
    options: [
      { key: 'A', label: 'Collaborate with others' },
      { key: 'B', label: 'Think things through carefully' },
      { key: 'C', label: 'Tackle it head-on with a strategic plan' },
      { key: 'D', label: 'Adapt based on the situation' },
    ],
  },
  {
    prompt: '3. How do you feel about taking risks?',
    options: [
      { key: 'A', label: 'I love new experiences and adventures!' },
      { key: 'B', label: 'I prefer to stay in my comfort zone but I take risks sometimes' },
      { key: 'C', label: 'I take calculated risks for my goals' },
      { key: 'D', label: 'I am flexible and can adjust my plans as needed' },
    ],
  },
  {
    prompt: '4. What best describes your social interactions?',
    options: [
      { key: 'A', label: 'I thrive in large gatherings and enjoy being the center of attention.' },
      { key: 'B', label: 'I prefer small gatherings with close friends.' },
      { key: 'C', label: 'I enjoy my own space but can be social.' },
      { key: 'D', label: 'I enjoy forming deep connections with individuals' },
    ],
  },
  {
    prompt: '5. What describes your ideal vacation?',
    options: [
      { key: 'A', label: 'A lively trip to a popular destination.' },
      { key: 'B', label: 'I\'d rather stay at home and sleep.' },
      { key: 'C', label: 'An adventure about the things I love' },
      { key: 'D', label: 'A journey with friends where I can explore diverse environments.' },
    ],
  },
];

const BIRD_BY_LETTER = {
  A: {
    key: 'pelican',
    name: 'Pelican',
    img: require('./assets/pelican.png'),
    idCard: require('./assets/pelican_id.png'),
    blurb:
      'You are a pelican! You\'re most likely a social person who thrives in large groups and activities requiring cooperation. You\'re collaborative and someone who isn\'t afraid to take on a challenge!',
  },
  B: {
    key: 'intermediate_egret',
    name: 'Intermediate Egret',
    img: require('./assets/intermediate_egret.png'),
    idCard: require('./assets/egret_id.png'),
    blurb:
      'You are an intermediate egret! You most likely value solitude and introspection. Your patience and thoughtfulness is a prominent trait in your character.',
  },
  C: {
    key: 'bridled_tern',
    name: 'Bridled Tern',
    img: require('./assets/bridled_tern.png'),
    idCard: require('./assets/bridled_tern_id.png'),
    blurb:
      'You are a bridled tern! You are a strategic thinker who enjoys challenges. You know when to defend your space and when to engage socially.',
  },
  D: {
    key: 'common_tailorbird',
    name: 'Common Tailorbird',
    img: require('./assets/common_tailorbird.png'),
    idCard: require('./assets/tailorbird_id.png'),
    blurb:
      'You are a common tailorbird! You are adaptable and curious, finding joy in new experiences and strong connections with others.',
  },
};

const BG = require('./assets/background.png');
const TRAM_BG = require('./assets/tram_background_01.png');
const RAINY_BG = require('./assets/rainy_background.png');
const HURT_TRINGA = require('./assets/hurt-tringa-guttifer-box.png');
const HEALED_TRINGA = require('./assets/healed-tringa-guttifer.png');
const HOME_BG = require('./assets/home_background.png');
const BIRD_COLLECTION = require('./assets/bird_collection.png');
const QUESTS_IMG = require('./assets/quests.png');
const WORM = require('./assets/worm.png');
// Bird chat icons and names
const BIRD_CHAT_DATA = {
  pelican: { icon: require('./assets/pelican_icon.png'), name: 'LILIAN' },
  intermediate_egret: { icon: require('./assets/egret_icon.png'), name: 'EGBERT' },
  bridled_tern: { icon: require('./assets/bridled_icon.png'), name: 'TERESA' },
  common_tailorbird: { icon: require('./assets/tailorbird_icon.png'), name: 'TAILY' },
};

// App states
const APP_STATES = {
  QUIZ: 'quiz',
  RESULTS: 'results',
  PROFILE_CREATION: 'profile_creation',
  LOADING_TRAM: 'loading_tram',
  TRAM_GAME: 'tram_game',
};

// Phone frame dimensions - fixed iPhone size
const PHONE_WIDTH = 375; // iPhone standard width
const PHONE_HEIGHT = 812; // iPhone standard height (9:16 ratio)
const NOTCH_WIDTH = 132; // ~35mm on iPhone X-12
const NOTCH_HEIGHT = 20; // ~5.3mm
const BOTTOM_SAFE_AREA = 34; // Space for home indicator
const TOP_TEXT_SAFE_ZONE = 70; // Minimum distance from top for text
const BOTTOM_TEXT_SAFE_ZONE = 40; // Minimum distance from bottom for text

export default function App() {
  const [appState, setAppState] = useState(APP_STATES.QUIZ);
  const [userName, setUserName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [nameInput, setNameInput] = useState('');
  const [selectedBird, setSelectedBird] = useState(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [tramStage, setTramStage] = useState('question'); // 'question' | 'result'
  const [tramCorrect, setTramCorrect] = useState(false);
  const hurtOpacity = useRef(new Animated.Value(1)).current;
  const healedOpacity = useRef(new Animated.Value(0)).current;
  const wrongAnswerOpacity = useRef(new Animated.Value(0)).current;
  const [tramVisitCount, setTramVisitCount] = useState(0);
  const [showTramPopup, setShowTramPopup] = useState(false);
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const [appHeaderNav, setAppHeaderNav] = useState(null);
  const [arFacing, setArFacing] = useState('environment');
  const videoRef = useRef(null);
  const [arActive, setArActive] = useState(false);
  const [arBirds, setArBirds] = useState([
    { key: 'bunting', img: require('./assets/birdview_bunting.png'), opacity: new Animated.Value(0), visible: false, x: 0.15, y: 0.25, text: "ENDANGERED\nThe Yellow-breasted bunting, also known as the \"rice bird,\" is a passage migrant in Hong Kong that is now listed as critically endangered due to overhunting for consumption. Historically, thousands were seen during migration, but their numbers have dropped dramatically due to poaching, and today only small numbers are seen.\n\n15 🪙 has been added to your balance." },
    { key: 'eurasian', img: require('./assets/birdview_eurasian.png'), opacity: new Animated.Value(0), visible: false, x: 0.65, y: 0.45, text: "COMMON\nThe Eurasian Tree Sparrow is a very common bird in Hong Kong, found in urban and suburban areas like parks, residential neighborhoods, and villages, though they are absent from forests and uninhabited islands.\n\n5 🪙 has been added to your balance." },
    { key: 'oriental', img: require('./assets/birdview_oriental.png'), opacity: new Animated.Value(0), visible: false, x: 0.25, y: 0.65, text: "COMMON\nThe Oriental Magpie-Robin is a common resident bird in Hong Kong, found in both urban and rural areas like parks, gardens, and villages. They are known for their melodious and varied songs, including mimicry, and distinctive behavior like often cocking their tail. \n\n5 🪙 has been added to your balance." },
    { key: 'tern', img: require('./assets/birdview_tern.png'), opacity: new Animated.Value(0), visible: false, x: 0.75, y: 0.2, text: "UNCOMMON\nBridled Terns are summer visitors and passage migrants in Hong Kong, breeding on offshore islands in large numbers and found in areas like Mirs Bay and Tolo Channel. Their conservation status is of least concern.\n\n10 🪙 has been added to your balance." },
  ]);
  const [arInfo, setArInfo] = useState(null);
  const arRespawnTimer = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollViewRef = useRef(null);
  const [tringaEmojis, setTringaEmojis] = useState([]);
  const tringaEmojiIdCounter = useRef(0);
  const [tringaNavExpanded, setTringaNavExpanded] = useState(false);
  const [tringaNavMode, setTringaNavMode] = useState(null); // 'inventory', 'tasks', 'stats'
  const [wormPurchased, setWormPurchased] = useState(false);
  const [wormUsesRemaining, setWormUsesRemaining] = useState(0);
  const [showWormPurchasePopup, setShowWormPurchasePopup] = useState(false);
  const wormPurchasePopupOpacity = useRef(new Animated.Value(0)).current;
  const [wormEmojis, setWormEmojis] = useState([]);
  const wormEmojiIdCounter = useRef(0);
  // Stats and level state
  const [happiness, setHappiness] = useState(0);
  const [fullness, setFullness] = useState(0);
  const [health, setHealth] = useState(0);
  const [level, setLevel] = useState(1);
  const [wormsFed, setWormsFed] = useState(0);
  const level1Opacity = useRef(new Animated.Value(1)).current;
  const level2Opacity = useRef(new Animated.Value(0)).current;
  // Sponge drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isWashing, setIsWashing] = useState(false);
  const [washTime, setWashTime] = useState(0);
  const [bubbleEmojis, setBubbleEmojis] = useState([]);
  const bubbleEmojiIdCounter = useRef(0);
  const spongePan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const spongeGlobalPosition = useRef({ x: 0, y: 0 });

  // AR mode camera setup
  useEffect(() => {
    let showTimers = [];
    let hideTimers = [];
    async function startCamera() {
      if (!arActive) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: arFacing } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        // ignore
      }
      // schedule birds - max 2 at a time, first within 3 seconds
      const intervals = [2500, 8000, 15000, 22000];
      arBirds.forEach((b, idx) => {
        const showTimer = setTimeout(() => {
          // Check if we can show another bird (max 2 visible)
          setArBirds(prev => {
            const visible = prev.filter(x => x.visible).length;
            if (visible >= 2) return prev;
            Animated.timing(b.opacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
            return prev.map(x => x.key === b.key ? { ...x, visible: true } : x);
          });
          const hideTimer = setTimeout(() => {
            Animated.timing(b.opacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
              setArBirds(prev => prev.map(x => x.key === b.key ? { ...x, visible: false } : x));
            });
          }, 45000);
          hideTimers.push(hideTimer);
        }, intervals[idx % intervals.length]);
        showTimers.push(showTimer);
      });
    }
    startCamera();
    return () => {
      showTimers.forEach(clearTimeout);
      hideTimers.forEach(clearTimeout);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      // Reset birds when AR mode exits
      if (!arActive) {
        setArBirds(prev => prev.map(b => {
          b.opacity.setValue(0);
          return { ...b, visible: false };
        }));
        setArInfo(null);
      }
      if (arRespawnTimer.current) {
        clearTimeout(arRespawnTimer.current);
        arRespawnTimer.current = null;
      }
    };
  }, [arActive, arFacing]);

  // Ensure the screen is never empty for >3s in AR mode
  useEffect(() => {
    if (!arActive) return;
    const visible = arBirds.filter(b => b.visible).length;
    if (visible === 0) {
      if (arRespawnTimer.current) clearTimeout(arRespawnTimer.current);
      arRespawnTimer.current = setTimeout(() => {
        // pick a random bird to show
        const pool = arBirds;
        if (pool.length === 0) return;
        const idx = Math.floor(Math.random() * pool.length);
        const b = pool[idx];
        Animated.timing(b.opacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
        setArBirds(prev => prev.map(x => x.key === b.key ? { ...x, visible: true } : x));
      }, 2000);
    } else if (visible >= 1) {
      if (arRespawnTimer.current) {
        clearTimeout(arRespawnTimer.current);
        arRespawnTimer.current = null;
      }
    }
    return () => {
      if (arRespawnTimer.current && !arActive) {
        clearTimeout(arRespawnTimer.current);
        arRespawnTimer.current = null;
      }
    };
  }, [arBirds, arActive]);

  // Load custom fonts on app start
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'EtnaSansSerif': require('./assets/fonts/etna-sans-serif.otf'),
          'AncaCoder': require('./assets/fonts/anca-coder.ttf'),
          'CodecPro': require('./assets/fonts/codec-pro.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.log('Fonts not loaded, using fallback fonts');
        setFontsLoaded(true); // Still show app with fallback fonts
      }
    }
    loadFonts();
  }, []);

  // Animation effect when profile creation screen opens
  useEffect(() => {
    if (appState === APP_STATES.PROFILE_CREATION) {
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [appState]);

  // Reset stats when navigating to tringa_home
  useEffect(() => {
    if (appState === 'tringa_home') {
      setHappiness(0);
      setFullness(0);
      setHealth(0);
      setLevel(1);
      setWormsFed(0);
      level1Opacity.setValue(1);
      level2Opacity.setValue(0);
      setIsWashing(false);
      setWashTime(0);
      setBubbleEmojis([]);
    }
  }, [appState]);


  // Check for saved login on app start
  useEffect(() => {
    checkSavedLogin();
  }, []);

  const checkSavedLogin = async () => {
    try {
      const savedLogin = await AsyncStorage.getItem('userLogin');
      const savedQuizDone = await AsyncStorage.getItem('quizCompleted');
      if (savedLogin) {
        const { userName: savedName, rememberMe: savedRemember } = JSON.parse(savedLogin);
        if (savedRemember) {
          setUserName(savedName);
          setRememberMe(true);
          // If quiz is completed, go to home instead of quiz
          if (savedQuizDone === 'true') {
            // Load selected bird from storage
            const savedBird = await AsyncStorage.getItem('selectedBird');
            if (savedBird) {
              const birdData = JSON.parse(savedBird);
              setSelectedBird(birdData);
            }
            setAppState('home');
          } else {
            setAppState(APP_STATES.QUIZ);
          }
        } else {
          setAppState(APP_STATES.QUIZ);
        }
      } else {
        setAppState(APP_STATES.QUIZ);
      }
    } catch (error) {
      console.log('Error checking saved login:', error);
    }
  };



  const handleReset = async () => {
    try {
      await AsyncStorage.removeItem('userLogin');
      await AsyncStorage.removeItem('quizDone');
      await AsyncStorage.removeItem('selectedBird');
    } catch (error) {
      console.log('Error resetting:', error);
    }
    setUserName('');
    setQuizIndex(0);
    setAnswers([]);
    setNameInput('');
    setSelectedBird(null);
    setAppState(APP_STATES.QUIZ);
  };

  const isQuizDone = quizIndex >= QUESTIONS.length;

  const result = useMemo(() => {
    if (!isQuizDone) return null;
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    answers.forEach(a => (counts[a] += 1));
    const entries = Object.entries(counts);
    entries.sort((a, b) => b[1] - a[1]);
    const [top, second] = entries;
    const tie = second && top[1] - second[1] <= 0 ? [top[0], second[0]] : [top[0]];
    return tie.map(letter => BIRD_BY_LETTER[letter]);
  }, [answers, isQuizDone]);

  const onPickAnswer = (letter) => {
    setAnswers(prev => [...prev, letter]);
    setQuizIndex(i => i + 1);
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setAnswers([]);
    setAppState(APP_STATES.QUIZ);
  };



  const renderQuizScreen = () => {
    // If quiz is done, show results instead
    if (isQuizDone) {
      return renderResultsScreen();
    }
    
    return (
      <View style={styles.mobileContainer}>
        <ImageBackground source={BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1.0 }}>
          <SafeAreaView style={styles.safe}>
            <StatusBar style="dark" />
            <View style={styles.quizContent}>
              <View style={styles.titleGradient}>
                <Text style={styles.title}>WHAT BIRD ARE YOU?</Text>
              </View>
              <Text style={styles.progress}>{quizIndex + 1} / {QUESTIONS.length}</Text>
              <View style={styles.promptGradient}>
                <Text style={styles.prompt}>{QUESTIONS[quizIndex].prompt}</Text>
              </View>
              <View style={{ height: 18 }} />
              {QUESTIONS[quizIndex].options.map(o => (
                <TouchableOpacity key={o.key} style={styles.option} onPress={() => onPickAnswer(o.key)}>
                  <Text style={styles.optionText}>{o.key}) {o.label}</Text>
                </TouchableOpacity>
              ))}
              {quizIndex > 0 && (
                <TouchableOpacity style={styles.backButton} onPress={() => setQuizIndex(i => Math.max(0, i - 1))}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  };

  const renderResultsScreen = () => (
    <View style={styles.mobileContainer}>
      <ImageBackground source={BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1.0 }}>
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <ScrollView 
            contentContainerStyle={styles.resultContentScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultContent}>
              <Text style={styles.resultTitle}>YOU ARE A...</Text>
              <Text style={styles.birdTypeTitle}>{result[0].name.toUpperCase()}!</Text>
              <View style={{ marginTop: -50, alignItems: 'center' }}>
                <Image source={result[0].img} style={[styles.largeBirdImg, styles.resultIdCard]} resizeMode="cover" />
                <Text style={[styles.blurb, { textAlign: 'center' }]}>{result[0].blurb}</Text>
                <TouchableOpacity style={[styles.primary, styles.resultsBeginButton]} onPress={async () => {
                  setSelectedBird(result[0]);
                  setShowIdCard(true);
                  // Save quiz completion and selected bird
                  try {
                    await AsyncStorage.setItem('quizCompleted', 'true');
                    await AsyncStorage.setItem('selectedBird', JSON.stringify(result[0]));
                  } catch (error) {
                    console.log('Error saving quiz completion:', error);
                  }
                  setTramVisitCount(0); // Reset tram visit count for new session
                  setAppState(APP_STATES.PROFILE_CREATION);
                }}>
                  <Text style={styles.primaryText}>Begin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  const renderProfileCreationScreen = () => {
    if (!selectedBird) return null;
    
    return (
      <View style={styles.mobileContainer}>
        <ImageBackground source={BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1.0 }}>
          <SafeAreaView style={styles.safe}>
            <StatusBar style="dark" />
            <View style={styles.profileCreationContent}>
              {showIdCard && selectedBird.idCard ? (
                <Animated.View style={[styles.idCardWrapper, { transform: [{ scale: animatedValue }], marginTop: -50 }]}>
                  <Image source={selectedBird.idCard} style={styles.idCardImage} resizeMode="contain" />
                </Animated.View>
              ) : (
                <Image source={selectedBird.img} style={[styles.idCardImage, { marginTop: -50 }]} resizeMode="contain" />
              )}
              <View style={{ marginTop: -180, alignItems: 'center' }}>
                <Text style={styles.welcomeUserText}>Welcome to{ '\n' }Perchliner!</Text>
                <TouchableOpacity style={styles.primary} onPress={() => {
                  // Proceed to loading for tram
                  setAppState(APP_STATES.LOADING_TRAM);
                }}>
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  };

  // Removed separate bird blurb screen per new flow

  // Handle loading tram screen transition
  useEffect(() => {
    if (appState === APP_STATES.LOADING_TRAM) {
      // After 2 seconds, fade to tram game
      const timer = setTimeout(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setAppState(APP_STATES.TRAM_GAME);
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  const renderLoadingTramScreen = () => {
    return (
      <View style={styles.mobileContainer}>
        <ImageBackground source={BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1.0 }}>
          <SafeAreaView style={styles.safe}>
            <StatusBar style="dark" />
            <View style={styles.loadingContent}>
              <TouchableOpacity style={styles.homeIcon} onPress={() => setAppState('home')}>
                <Text style={styles.homeIconText}>⌂</Text>
              </TouchableOpacity>
              <Text style={styles.loadingTramText}>connecting to your tram ride...</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  };

  const renderTramGameScreen = () => {
    // First visit (count 0) = tram bg, second visit (count 1+) = rainy bg
    // Check current count before it's incremented - so first click shows tram bg
    const currentCount = tramVisitCount;
    const isSecondVisit = currentCount > 0;
    const currentBg = isSecondVisit ? RAINY_BG : TRAM_BG;
    const isFirstQuestion = currentCount === 0;
    
    return (
      <View style={styles.mobileContainer}>
        <ImageBackground source={currentBg} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 0.7 }}>
          <SafeAreaView style={styles.safe}>
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.tramContent} showsVerticalScrollIndicator={false}>
              <View style={{ marginTop: 60 }}>
                <Text style={styles.locationHeaderTop}>YOU ARE AT</Text>
                <Text style={styles.locationHeaderSub}>25E: Jubilee Street</Text>
              </View>
              {/* Home icon top-right */}
              <TouchableOpacity style={styles.homeIcon} onPress={() => setAppState('home')}>
                <Text style={styles.homeIconText}>⌂</Text>
              </TouchableOpacity>
              <Text style={styles.instructionText}>Answer the question to save the bird</Text>
              {tramStage === 'question' ? (
                <>
                  <View style={[styles.healArea, { height: MOBILE_WIDTH * 0.9 }]}>
                    <Image source={HURT_TRINGA} style={styles.healImageQuestion} resizeMode="contain" />
                  </View>
                  <Text style={styles.tramQuestion}>
                    {isFirstQuestion 
                      ? 'Which of the following actions is the most harmful to birds?'
                      : 'What is one main threat to bird populations in Hong Kong?'}
                  </Text>
                  <View style={styles.tramOptions}>
                    {isFirstQuestion ? (
                      <>
                        <TouchableOpacity style={[styles.option, styles.tramOption]} onPress={() => { 
                          setTramCorrect(false); 
                          setTramStage('result');
                          wrongAnswerOpacity.setValue(0);
                          Animated.timing(wrongAnswerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                        }}>
                          <Text style={[styles.optionText, styles.tramOptionText]}>A) Planting native trees</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.option, styles.tramOption]} onPress={() => {
                          setTramCorrect(true);
                          setTramStage('result');
                          // start heal animation
                          hurtOpacity.setValue(1);
                          healedOpacity.setValue(0);
                          wrongAnswerOpacity.setValue(0);
                          Animated.parallel([
                            Animated.timing(hurtOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
                            Animated.timing(healedOpacity, { toValue: 1, duration: 800, useNativeDriver: true })
                          ]).start();
                          // Show popup
                          setShowTramPopup(true);
                          popupOpacity.setValue(0);
                          Animated.timing(popupOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
                        }}>
                          <Text style={[styles.optionText, styles.tramOptionText]}>B) Feeding bread to pond ducks</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.option, styles.tramOption]} onPress={() => { 
                          setTramCorrect(false); 
                          setTramStage('result');
                          wrongAnswerOpacity.setValue(0);
                          Animated.timing(wrongAnswerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                        }}>
                          <Text style={[styles.optionText, styles.tramOptionText]}>C) Keeping pet cats indoors</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.option, styles.tramOption]} onPress={() => { 
                          setTramCorrect(false); 
                          setTramStage('result');
                          wrongAnswerOpacity.setValue(0);
                          Animated.timing(wrongAnswerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                        }}>
                          <Text style={[styles.optionText, styles.tramOptionText]}>D) Installing backyard birdhouses</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity style={[styles.option, styles.tramOption]} onPress={() => { 
                          setTramCorrect(false); 
                          setTramStage('result');
                          wrongAnswerOpacity.setValue(0);
                          Animated.timing(wrongAnswerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                        }}>
                          <Text style={[styles.optionText, styles.tramOptionText]}>A) Overpopulation of birds</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.option, styles.tramOption]} onPress={() => {
                          setTramCorrect(true);
                          setTramStage('result');
                          // start heal animation
                          hurtOpacity.setValue(1);
                          healedOpacity.setValue(0);
                          wrongAnswerOpacity.setValue(0);
                          Animated.parallel([
                            Animated.timing(hurtOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
                            Animated.timing(healedOpacity, { toValue: 1, duration: 800, useNativeDriver: true })
                          ]).start();
                          // Show popup
                          setShowTramPopup(true);
                          popupOpacity.setValue(0);
                          Animated.timing(popupOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
                        }}>
                          <Text style={[styles.optionText, styles.tramOptionText]}>B) Habitat loss due to urban development</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.option, styles.tramOption]} onPress={() => { 
                          setTramCorrect(false); 
                          setTramStage('result');
                          wrongAnswerOpacity.setValue(0);
                          Animated.timing(wrongAnswerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                        }}>
                          <Text style={[styles.optionText, styles.tramOptionText]}>C) Too many bird feeders</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.option, styles.tramOption]} onPress={() => { 
                          setTramCorrect(false); 
                          setTramStage('result');
                          wrongAnswerOpacity.setValue(0);
                          Animated.timing(wrongAnswerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                        }}>
                          <Text style={[styles.optionText, styles.tramOptionText]}>D) Birds migrating too early</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.healArea}>
                    {/* Wrong answer red aura - behind bird */}
                    <Animated.View style={[styles.wrongAura, { opacity: wrongAnswerOpacity }]} />
                    {/* Healing auras - behind bird */}
                    <Animated.View style={[styles.aura, styles.aura1, { opacity: healedOpacity }]} />
                    <Animated.View style={[styles.aura, styles.aura2, { opacity: healedOpacity }]} />
                    <Animated.View style={[styles.aura, styles.aura3, { opacity: healedOpacity }]} />
                    {/* Bird images - above circles */}
                    <Animated.Image source={HURT_TRINGA} style={[styles.healImage, { opacity: hurtOpacity }]} resizeMode="contain" />
                    <Animated.Image source={HEALED_TRINGA} style={[styles.healImage, { opacity: healedOpacity }]} resizeMode="contain" />
                  </View>
                  <View style={styles.resultOverlay}> 
                    {tramCorrect ? (
                      <Text style={styles.tramResultText}>You chose B, which is correct! You have saved the hurt Tringa Guttifer. The Tringa Guttifer is a rare but regular spring passage migrant in Hong Kong, which unfortunately hurt itself in Julibee Street. Thanks to your help, it is now healed and added to your collection!</Text>
                    ) : (
                      <Text style={styles.tramResultText}>
                        {isFirstQuestion 
                          ? 'Oh no, the right answer is B- Pond ducks can\'t eat bread because it is nutritionally deficient, leading to malnutrition and health problems like angel wing syndrome. Unfortunately, you could not save the wounded bird. Try again next time!'
                          : 'Oh no, the right answer is B- Habitat loss due to urban development leads to ecosystems being affected, and overall the biodiversity of birds, through the physical destruction of natural areas and the fragmentation of remaining habitats into smaller, isolated patches. Unfortunately, you could not save the wounded bird. Try again next time!'}
                      </Text>
                    )}
                  </View>
                </>
              )}
              {/* Popup for correct answer */}
              {showTramPopup && (
                <View style={styles.popupOverlay}>
                  <Animated.View style={[styles.tramPopup, { opacity: popupOpacity }]}>
                    <Text style={styles.popupTitle}>+ NEW BIRD: Tringa Guttifer (endangered)</Text>
                    <Text style={styles.popupTitle}>+ 200 POINTS EARNED</Text>
                    <Text style={styles.popupHint}>You can view your bird in the "Visit your flock" option in the homepage.</Text>
                    <TouchableOpacity style={styles.popupCloseButton} onPress={() => {
                      Animated.timing(popupOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                        setShowTramPopup(false);
                      });
                    }}>
                      <Text style={styles.popupCloseText}>Close</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  };

  const renderHomeScreen = () => (
    <View style={styles.mobileContainer}>
        <ImageBackground source={HOME_BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1 }}>
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <View style={{ marginTop: 120 }}>
              <Text style={styles.locationHeaderTop}>WELCOME TO</Text>
              <Text style={styles.locationHeaderSub}>Perchliner</Text>
            </View>
            {/* Centered buttons */}
            <View style={styles.homeButtons}>
              <TouchableOpacity style={styles.homeBtn} onPress={() => { 
                setTramStage('question'); 
                hurtOpacity.setValue(1); 
                healedOpacity.setValue(0);
                wrongAnswerOpacity.setValue(0);
                // Increment count when clicking from home - second click will show rainy bg
                setTramVisitCount(prev => prev + 1);
                setAppState(APP_STATES.TRAM_GAME); 
              }}>
                <Text style={styles.primaryText}>Connect to tram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeBtn} onPress={() => { setArActive(true); setAppState('ar_mode'); }}>
                <Text style={styles.primaryText}>AR bird mode</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeBtn} onPress={() => setAppState('quests')}>
                <Text style={styles.primaryText}>Quests</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeBtn} onPress={() => setAppState('tringa_home')}>
                <Text style={styles.primaryText}>Visit Your Flock</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bottomNav}>
              <TouchableOpacity onPress={() => setAppState('birds_collection')}>
                <Text style={styles.navIconLarge}>🐦</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (selectedBird) {
                  setChatMessages([{
                    type: 'ai',
                    text: `I'm ${BIRD_CHAT_DATA[selectedBird.key]?.name || 'your companion'}, your AI bird companion! What would you like to learn about today?`
                  }]);
                  setAppState('chat');
                }
              }}>
                <Text style={styles.navIconLarge}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAppState('shop')}>
                <Text style={styles.navIconLarge}>🛒</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAppState('profile')}>
                <Text style={styles.navIconLarge}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  const renderArScreen = () => (
    <View style={styles.mobileContainer}>
      <View style={styles.arContainer}>
        <TouchableOpacity style={styles.homeIcon} onPress={() => { setArActive(false); setAppState('home'); }}>
          <Text style={styles.homeIconText}>⌂</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.arSwitch} onPress={() => setArFacing(f => f === 'environment' ? 'user' : 'environment')}>
          <Text style={styles.primaryText}>Switch camera</Text>
        </TouchableOpacity>
        {/* Camera preview */}
        <video ref={videoRef} playsInline muted autoPlay style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Blur overlay when bird is clicked */}
        {arInfo && <View style={styles.arBlurOverlay} />}
        {/* Instruction banner */}
        <View style={[styles.resultOverlay, { position: 'absolute', bottom: BOTTOM_TEXT_SAFE_ZONE + 60, left: 16, right: 16 }]}>
          <Text style={styles.tramResultText}>Click on any bird to learn more about the species and gain rewards!</Text>
        </View>
        {/* Birds - only show visible ones, scattered positions */}
        {arBirds.filter(b => b.visible).map(b => (
          <Animated.View key={b.key} style={[styles.arBird, { 
            opacity: b.opacity, 
            left: PHONE_WIDTH * b.x - (PHONE_WIDTH * 0.4) / 2,
            top: PHONE_HEIGHT * b.y - (PHONE_WIDTH * 0.4) / 2,
          }]}>
            <TouchableOpacity onPress={() => setArInfo(b)}>
              <Image source={b.img} style={styles.arBirdImg} resizeMode="contain" />
            </TouchableOpacity>
          </Animated.View>
        ))}
        {arInfo && (
          <View style={[styles.resultOverlay, { position: 'absolute', bottom: BOTTOM_TEXT_SAFE_ZONE + 70, left: 16, right: 16, zIndex: 1000 }] }>
            <TouchableOpacity onPress={() => setArInfo(null)}>
              <Text style={styles.tramResultText}>{arInfo.text}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderQuestsScreen = () => (
    <View style={styles.mobileContainer}>
      <ImageBackground source={BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1.0 }}>
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.homeIcon} onPress={() => setAppState('home')}>
              <Text style={styles.homeIconText}>⌂</Text>
            </TouchableOpacity>
            <View style={{ marginTop: 120 }}>
              <Text style={styles.locationHeaderTop}>QUESTS</Text>
              <Text style={styles.locationHeaderSub}>Compete unique quests to gain rewards</Text>
            </View>
            <View style={styles.birdCollectionContainer}>
              <Image source={QUESTS_IMG} style={styles.birdCollectionImage} resizeMode="contain" />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  const renderBirdsCollectionScreen = () => (
    <View style={styles.mobileContainer}>
      <ImageBackground source={BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1.0 }}>
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.homeIcon} onPress={() => setAppState('home')}>
              <Text style={styles.homeIconText}>⌂</Text>
            </TouchableOpacity>
            <View style={{ marginTop: 120 }}>
              <Text style={styles.locationHeaderTop}>BIRDS COLLECTION</Text>
              <Text style={styles.locationHeaderSub}>Your flock of birds</Text>
            </View>
            <View style={styles.birdCollectionContainer}>
              <Image source={BIRD_COLLECTION} style={styles.birdCollectionImage} resizeMode="contain" />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedBird) return;
    
    const userMsg = { type: 'user', text: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    const userQuestion = chatInput.trim().toLowerCase();
    setChatInput('');
    
    // Generate contextual AI response with bird characteristics
    setTimeout(() => {
      const birdData = BIRD_CHAT_DATA[selectedBird.key];
      let response = '';
      
      // Parse user question and provide relevant response
      if (userQuestion.includes('expand') || userQuestion.includes('more') || userQuestion.includes('explain') || userQuestion.includes('tell me more') || userQuestion.includes('elaborate')) {
        // User wants more detail on something mentioned previously
        const lastMessages = chatMessages.slice(-3).map(m => m.text.toLowerCase()).join(' ');
        if (lastMessages.includes('native tree') || lastMessages.includes('planting')) {
          response = `Squawk squawk! Chirp! Native trees are crucial because they provide the exact food sources we birds evolved to eat. They support insects that feed our young, offer nesting sites, and create habitat corridors. *Chirp chirp* In Hong Kong, native species like the Chinese Banyan and Hong Kong Orchid Tree support many bird species. When you plant native, you're restoring our natural ecosystem!`;
        } else if (lastMessages.includes('cat') || lastMessages.includes('indoor')) {
          response = `Chirp! Squawk squawk! Keeping cats indoors is vital because domestic cats are among the top human-caused threats to birds worldwide! *Squawk* They hunt even when well-fed, and their presence near nests causes stress. Indoor cats live longer, healthier lives too - it's safer for everyone! Chirp chirp!`;
        } else if (lastMessages.includes('endangered') || lastMessages.includes('threat')) {
          response = `Squawk squawk! Endangered birds face habitat loss, pollution, climate change, and illegal trade. *Chirp* In Hong Kong, species like the Yellow-breasted Bunting went from thousands to just a few sightings due to overhunting. Protection requires habitat preservation, law enforcement, and public awareness. Chirp chirp!`;
        } else {
          response = `Chirp chirp! Squawk! I'd be happy to expand! ${userQuestion.includes('what') ? 'What specifically would you like to know more about?' : 'Could you ask about something specific like habitat protection, endangered species, or conservation actions?'} *Squawk squawk!*`;
        }
      } else if (userQuestion.includes('harmful') || userQuestion.includes('bad') || userQuestion.includes('danger') || userQuestion.includes('threat')) {
        response = `Squawk squawk! Chirp! Several actions harm us birds: feeding bread to ducks (it's nutritionally deficient and causes health problems), letting cats roam outdoors (they hunt millions of birds yearly), using pesticides (kills our food sources), window collisions from glass buildings, and habitat destruction. *Chirp chirp* Every action counts!`;
      } else if (userQuestion.includes('endangered') || userQuestion.includes('rare') || userQuestion.includes('local endangered')) {
        response = `Chirp chirp! Squawk! In Hong Kong, endangered species include the Yellow-breasted Bunting (critically endangered due to overhunting), the Nordmann's Greenshank/Tringa Guttifer (rare passage migrant), and the Black-faced Spoonbill (winter visitor). *Squawk* Their habitats need protection, especially wetlands and mudflats!`;
      } else if (userQuestion.includes('help') || userQuestion.includes('protect') || userQuestion.includes('conserve') || userQuestion.includes('save')) {
        response = `Squawk squawk! Chirp chirp! You can help by: planting native trees, keeping cats indoors, avoiding pesticides, reducing window collisions (use decals), supporting wetland conservation, and spreading awareness! *Chirp* Every small action creates safer spaces for us!`;
      } else if (userQuestion.includes('habitat') || userQuestion.includes('home') || userQuestion.includes('live') || userQuestion.includes('where')) {
        response = `Chirp! *Squawk squawk* Different birds need different habitats! Wetlands support waterbirds, forests provide nesting for songbirds, urban parks help adaptable species, and mudflats are crucial for migratory shorebirds. *Chirp chirp* Habitat loss from development is our biggest threat!`;
      } else if (userQuestion.includes('migrat') || userQuestion.includes('travel') || userQuestion.includes('journey')) {
        response = `Squawk squawk! Chirp! Many Hong Kong birds are migrants - they travel thousands of kilometers between breeding and wintering grounds! *Chirp chirp* Stopover sites like Mai Po Marshes are critical resting points. Climate change affects migration timing. Squawk!`;
      } else if (userQuestion.includes('food') || userQuestion.includes('eat') || userQuestion.includes('feed')) {
        response = `Chirp chirp! Squawk! Birds eat varied diets - seeds, fruits, insects, fish, nectar! *Squawk* Please don't feed us bread - it's junk food for birds! Instead, plant native plants that provide natural food sources. Feeding wildlife can create dependency and spread disease! Chirp!`;
      } else if (userQuestion.includes('nest') || userQuestion.includes('breed') || userQuestion.includes('baby') || userQuestion.includes('young')) {
        response = `Squawk squawk! Chirp! Nesting season is critical - we need safe, undisturbed areas! *Chirp* Some birds nest in trees, others in reeds, cliffs, or on the ground. Disturbance during breeding can cause nest abandonment. Conservation areas protect our breeding sites!`;
      } else if (userQuestion.includes('hong kong') || userQuestion.includes('local')) {
        response = `Chirp chirp! Squawk! Hong Kong is amazing for bird diversity! We have resident birds, winter visitors, summer breeders, and passage migrants. *Squawk* Key sites include Mai Po Marshes, Deep Bay, and country parks. Urban areas support species like Eurasian Tree Sparrows! Chirp!`;
      } else if (userQuestion.includes('how are you') || userQuestion.includes('how do you feel')) {
        response = `I'm doing well! Chirp! Thank you for asking! *Squawk squawk* What would you like to learn about today?`;
      } else if (userQuestion.includes('name') && (userQuestion.includes('mean') || userQuestion.includes('from') || userQuestion.includes('origin'))) {
        const nameMeanings = {
          'LILIAN': `Chirp! LILIAN comes from my species name - I'm a Pelican! *Squawk squawk* Pelicans are known for our large bills and social nature. Chirp chirp!`,
          'TERESA': `Squawk squawk! TERESA is inspired by my species - the Bridled Tern! *Chirp* We're called "bridled" because of the dark markings around our eyes that look like a bridle. Chirp!`,
          'TAILY': `Chirp! TAILY comes from my species "Common Tailorbird"! *Squawk* We get our name from how we "sew" leaves together to make nests. Chirp chirp!`,
          'EGBERT': `Squawk! EGBERT comes from my species - the Intermediate Egret! *Chirp chirp* Egrets are elegant wading birds, and I'm the intermediate-sized one!`,
        };
        response = nameMeanings[birdData?.name] || `Chirp chirp! My name ${birdData?.name} comes from my bird species! *Squawk squawk*`;
      } else if (userQuestion.includes('hello') || userQuestion.includes('hi') || userQuestion.includes('hey')) {
        response = `Squawk squawk! Chirp chirp! Hello! I'm ${birdData?.name}! *Squawk* I'm so excited you want to learn about birds and conservation! What would you like to know? Chirp!`;
      } else if (userQuestion.includes('who are you') || userQuestion.includes('what are you')) {
        response = `Chirp! Squawk squawk! I'm ${birdData?.name}, your AI bird companion! *Chirp chirp* I'm here to help you learn about bird conservation, habitats, and how to protect my feathered friends. Ask me anything! Squawk!`;
      } else {
        // Generic response for unrecognized questions
        response = `Could you ask about something specific like harmful actions, endangered species, habitats, migration, or ways to help? *Squawk squawk!*`;
      }
      
      // Add bird name and sounds naturally if not already included
      if (!response.includes(birdData?.name)) {
        response = `Chirp chirp! ${birdData?.name} here! Squawk squawk! ${response}`;
      }
      
      setChatMessages(prev => [...prev, { type: 'ai', text: response }]);
      
      // Scroll to bottom
      setTimeout(() => {
        if (chatScrollViewRef.current) {
          chatScrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }, 500);
  };

  const handleWormTap = () => {
    if (wormUsesRemaining <= 0) return;
    
    const wormEmojis = ['🪱'];
    const randomEmoji = wormEmojis[Math.floor(Math.random() * wormEmojis.length)];
    
    const emojiId = wormEmojiIdCounter.current++;
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0);
    const translateY = new Animated.Value(0);
    
    const newEmoji = {
      id: emojiId,
      emoji: randomEmoji,
      opacity,
      scale,
      translateY,
    };
    
    setWormEmojis(prev => [...prev, newEmoji]);
    
    // Increase fullness by 10%
    setFullness(prev => Math.min(100, prev + 10));
    
    // Track worms fed and check for level progression
    setWormsFed(prev => {
      const newCount = prev + 1;
      // After 8 worms, level up to 2
      if (newCount >= 8 && level === 1) {
        setLevel(2);
        // Fade out level 1, fade in level 2
        Animated.parallel([
          Animated.timing(level1Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(level2Opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]).start();
      }
      return newCount;
    });
    
    // Decrement uses
    setWormUsesRemaining(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        // Worm pack is empty, but keep it purchased
      }
      return newCount;
    });
    
    // Animate: start small, grow while rising, then fade out
    Animated.parallel([
      // Fade in quickly
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      // Rise to top while growing bigger
      Animated.parallel([
        Animated.timing(translateY, { toValue: -200, duration: 1800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 2.5, duration: 1800, useNativeDriver: true }),
      ]),
      // Fade out near the end
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Remove emoji after animation completes
      setWormEmojis(prev => prev.filter(e => e.id !== emojiId));
    });
  };

  const handleTringaTap = () => {
    const happyEmojis = ['😊', '🥰', '😄', '😍', '🤗', '😁', '😃', '😆', '😋', '😌', '😎', '🥳', '🤩', '😇', '🙂', '😉'];
    const randomEmoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
    
    const emojiId = tringaEmojiIdCounter.current++;
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0);
    const translateY = new Animated.Value(0);
    
    const newEmoji = {
      id: emojiId,
      emoji: randomEmoji,
      opacity,
      scale,
      translateY,
    };
    
    setTringaEmojis(prev => [...prev, newEmoji]);
    
    // Increase happiness by 10%
    setHappiness(prev => Math.min(100, prev + 10));
    
    // Animate: start small, grow while rising, then fade out
    Animated.parallel([
      // Fade in quickly
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      // Rise to top while growing bigger
      Animated.parallel([
        Animated.timing(translateY, { toValue: -200, duration: 1800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 2.5, duration: 1800, useNativeDriver: true }),
      ]),
      // Fade out near the end
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Remove emoji after animation completes
      setTringaEmojis(prev => prev.filter(e => e.id !== emojiId));
    });
  };

  // Create bubble emoji animation
  const createBubbleEmoji = (x, y) => {
    const bubbleEmoji = '🫧';
    
    const emojiId = bubbleEmojiIdCounter.current++;
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0);
    const translateY = new Animated.Value(0);
    const translateX = new Animated.Value(0);
    
    // Random scatter - not too random
    const scatterX = (Math.random() - 0.5) * 80;
    const scatterY = (Math.random() - 0.5) * 80;
    
    const newEmoji = {
      id: emojiId,
      emoji: bubbleEmoji,
      opacity,
      scale,
      translateY,
      translateX,
      x: x + scatterX,
      y: y + scatterY,
    };
    
    setBubbleEmojis(prev => [...prev, newEmoji]);
    
    // Animate: start small, grow while rising, then fade out
    Animated.parallel([
      // Fade in quickly
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      // Rise to top while growing bigger with scatter
      Animated.parallel([
        Animated.timing(translateY, { toValue: -150 + scatterY, duration: 1800, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: scatterX, duration: 1800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 2, duration: 1800, useNativeDriver: true }),
      ]),
      // Fade out near the end
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Remove emoji after animation completes
      setBubbleEmojis(prev => prev.filter(e => e.id !== emojiId));
    });
  };

  // Check if sponge is over bird
  const isSpongeOverBird = (spongeX, spongeY) => {
    // Bird is roughly centered, adjust these values based on actual bird position
    const birdCenterX = MOBILE_WIDTH / 2;
    const birdCenterY = PHONE_HEIGHT * 0.5; // Adjust based on actual bird position
    const birdRadius = MOBILE_WIDTH * 0.2;
    
    const distance = Math.sqrt(
      Math.pow(spongeX - birdCenterX, 2) + Math.pow(spongeY - birdCenterY, 2)
    );
    
    return distance < birdRadius;
  };

  // Sponge pan responder
  const spongePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const { pageX, pageY } = evt.nativeEvent;
        spongeGlobalPosition.current = { x: pageX, y: pageY };
        spongePan.stopAnimation(value => {
          spongePan.setOffset({ x: value.x, y: value.y });
          spongePan.setValue({ x: 0, y: 0 });
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        Animated.event([null, { dx: spongePan.x, dy: spongePan.y }], { useNativeDriver: false })(evt, gestureState);
        const { pageX, pageY } = evt.nativeEvent;
        spongeGlobalPosition.current = { x: pageX, y: pageY };

        // Check if over bird and create bubbles
        const birdCenterX = MOBILE_WIDTH / 2;
        const birdCenterY = PHONE_HEIGHT * 0.45;
        const distance = Math.sqrt(
          Math.pow(pageX - birdCenterX, 2) + Math.pow(pageY - birdCenterY, 2)
        );

        if (distance < MOBILE_WIDTH * 0.25) {
          if (!isWashing) {
            setIsWashing(true);
            setWashTime(0);
          }
          if (Math.random() < 0.3) {
            createBubbleEmoji(pageX, pageY);
          }
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        setIsWashing(false);
        spongePan.flattenOffset();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setIsWashing(false);
        spongePan.flattenOffset();
      },
    })
  ).current;

  // Washing timer effect
  useEffect(() => {
    let interval;
    if (isWashing) {
      interval = setInterval(() => {
        setWashTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= 20) {
            // 20 seconds completed, set health to 100%
            setHealth(100);
            setIsWashing(false);
            return 20;
          }
          return newTime;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWashing]);

  const renderTringaHomeScreen = () => (
    <View style={styles.mobileContainer}>
      <ImageBackground source={HOME_BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1 }}>
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.homeIcon} onPress={() => setAppState('home')}>
              <Text style={styles.homeIconText}>⌂</Text>
            </TouchableOpacity>
            <View style={{ marginTop: 120 }}>
              <Text style={styles.locationHeaderTop}>TRINGA'S HOME</Text>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', height: 40 }}>
                <Animated.Text style={[styles.locationHeaderSub, { opacity: level1Opacity, position: 'absolute' }]}>Level 1</Animated.Text>
                <Animated.Text style={[styles.locationHeaderSub, { opacity: level2Opacity, position: 'absolute' }]}>Level 2</Animated.Text>
              </View>
            </View>
            <View style={[styles.tringaImageContainer, { marginTop: -25 }]}>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }} pointerEvents="box-none">
                 <TouchableOpacity activeOpacity={1} onPress={handleTringaTap}>
                   <Image 
                     source={HEALED_TRINGA} 
                     style={styles.tringaImage} 
                     resizeMode="contain"
                   />
                 </TouchableOpacity>
                 {/* Animated emojis */}
                 {tringaEmojis.map(emoji => (
                   <Animated.View
                     key={emoji.id}
                     style={[
                       styles.tringaEmoji,
                       {
                         opacity: emoji.opacity,
                         transform: [
                           { scale: emoji.scale },
                           { translateY: emoji.translateY },
                         ],
                       },
                     ]}
                     pointerEvents="none"
                   >
                     <Text style={styles.tringaEmojiText}>{emoji.emoji}</Text>
                   </Animated.View>
                 ))}
                 {/* Bubble emojis from washing */}
                 {bubbleEmojis.map(emoji => (
                   <Animated.View
                     key={emoji.id}
                     style={[
                       styles.tringaEmoji,
                       {
                         position: 'absolute',
                         left: emoji.x - 24,
                         top: emoji.y - 24,
                         opacity: emoji.opacity,
                         transform: [
                           { scale: emoji.scale },
                           { translateY: emoji.translateY },
                           { translateX: emoji.translateX },
                         ],
                       },
                     ]}
                     pointerEvents="none"
                   >
                     <Text style={styles.tringaEmojiText}>{emoji.emoji}</Text>
                   </Animated.View>
                 ))}
               </View>
             </View>
            <View style={[styles.tringaBottomNav, tringaNavExpanded && styles.tringaBottomNavExpanded]}>
              <TouchableOpacity 
                style={styles.tringaNavButton} 
                onPress={() => {
                  setTringaNavMode('inventory');
                  setTringaNavExpanded(true);
                }}
              >
                <Text style={styles.primaryText}>Inventory</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.tringaNavButton}
                onPress={() => {
                  setTringaNavMode('tasks');
                  setTringaNavExpanded(true);
                }}
              >
                <Text style={styles.primaryText}>Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.tringaNavButton}
                onPress={() => {
                  setTringaNavMode('stats');
                  setTringaNavExpanded(true);
                }}
              >
                <Text style={styles.primaryText}>Stats</Text>
              </TouchableOpacity>
              {tringaNavExpanded && (
                <TouchableOpacity 
                  style={styles.tringaNavCloseButton}
                  onPress={() => {
                    setTringaNavExpanded(false);
                    setTringaNavMode(null);
                  }}
                >
                  <Text style={styles.tringaNavCloseText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Expanded content area */}
            {tringaNavExpanded && (
              <View style={styles.tringaExpandedContent}>
                {tringaNavMode === 'inventory' && (
                  <View style={styles.inventoryContent}>
                    <TouchableOpacity 
                      style={styles.wormItem}
                      onPress={() => {
                        if (wormPurchased && wormUsesRemaining > 0) {
                          handleWormTap();
                        } else {
                          // Show purchase popup if not purchased or if pack is empty
                          setShowWormPurchasePopup(true);
                          Animated.timing(wormPurchasePopupOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
                        }
                      }}
                    >
                      <Image 
                        source={WORM} 
                        style={[
                          styles.wormImage,
                          (!wormPurchased || wormUsesRemaining === 0) && styles.wormImageGrayscale
                        ]} 
                        resizeMode="contain"
                      />
                      <Text style={styles.wormItemTitle}>Pack of Worms</Text>
                      <Text style={styles.wormItemPrice}>30🪙</Text>
                    </TouchableOpacity>
                    
                    {/* Worm emojis */}
                    {wormEmojis.map(emoji => (
                      <Animated.View
                        key={emoji.id}
                        style={[
                          styles.tringaEmoji,
                          {
                            opacity: emoji.opacity,
                            transform: [
                              { scale: emoji.scale },
                              { translateY: emoji.translateY },
                            ],
                          },
                        ]}
                      >
                        <Text style={styles.tringaEmojiText}>{emoji.emoji}</Text>
                      </Animated.View>
                    ))}
                  </View>
                )}
                {tringaNavMode === 'tasks' && (
                  <View style={styles.tasksContent}>
                    <View style={styles.spongeWrapper} pointerEvents="box-none">
                      <Animated.View
                        {...spongePanResponder.panHandlers}
                        style={[
                          styles.spongeEmojiWrapper,
                          isDragging && styles.spongeItemDragging,
                          {
                            transform: [
                              { translateX: spongePan.x },
                              { translateY: spongePan.y },
                            ],
                          }
                        ]}
                      >
                        <Text style={styles.spongeEmoji}>🧽</Text>
                      </Animated.View>
                      <Text style={styles.spongeLabel}>Clean bird</Text>
                    </View>
                  </View>
                )}
                {tringaNavMode === 'stats' && (
                  <View style={styles.statsContent}>
                    <TouchableOpacity 
                      style={styles.statsCloseButton}
                      onPress={() => {
                        setTringaNavExpanded(false);
                        setTringaNavMode(null);
                      }}
                    >
                      <Text style={styles.statsCloseButtonText}>✕</Text>
                    </TouchableOpacity>
                    <View style={styles.statBarContainer}>
                      <Text style={styles.statLabel}>HAPPINESS</Text>
                      <View style={styles.statBarOuter}>
                        <View style={[styles.statBarInner, { width: `${happiness}%` }]} />
                      </View>
                      <Text style={styles.statPercentage}>{happiness}%</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <Text style={styles.statLabel}>FULLNESS</Text>
                      <View style={styles.statBarOuter}>
                        <View style={[styles.statBarInner, { width: `${fullness}%` }]} />
                      </View>
                      <Text style={styles.statPercentage}>{fullness}%</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <Text style={styles.statLabel}>HEALTH</Text>
                      <View style={styles.statBarOuter}>
                        <View style={[styles.statBarInner, { width: `${health}%` }]} />
                      </View>
                      <Text style={styles.statPercentage}>{health}%</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
            
            {/* Worm purchase popup */}
            {showWormPurchasePopup && (
              <Animated.View style={[styles.popupOverlay, { opacity: wormPurchasePopupOpacity }]}>
                <View style={styles.tramPopup}>
                  <Text style={styles.popupTitle}>Confirm to buy</Text>
                  <Text style={styles.popupSubheading}>1 pack of worms (10pc)</Text>
                  <TouchableOpacity
                    style={styles.popupCloseButton}
                    onPress={() => {
                      // Purchase worm
                      setWormPurchased(true);
                      setWormUsesRemaining(10);
                      setShowWormPurchasePopup(false);
                      Animated.timing(wormPurchasePopupOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
                    }}
                  >
                    <Text style={styles.popupCloseText}>Confirm with 30🪙</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.popupCloseButton, { backgroundColor: '#999', marginTop: 8 }]}
                    onPress={() => {
                      setShowWormPurchasePopup(false);
                      Animated.timing(wormPurchasePopupOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
                    }}
                  >
                    <Text style={styles.popupCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  const renderShopScreen = () => (
    <View style={styles.mobileContainer}>
      <ImageBackground source={HOME_BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1 }}>
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.homeIcon} onPress={() => setAppState('home')}>
              <Text style={styles.homeIconText}>⌂</Text>
            </TouchableOpacity>
            <View style={{ marginTop: 95 }}>
              <Text style={styles.locationHeaderTop}>PERCHLINER SHOP</Text>
              <Text style={styles.shopSubheading}>Exchange incentives with points</Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  const renderProfileScreen = () => {
    if (!selectedBird) return renderHomeScreen();
    
    return (
      <View style={styles.mobileContainer}>
        <ImageBackground source={HOME_BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1 }}>
          <SafeAreaView style={styles.safe}>
            <StatusBar style="dark" />
            <View style={{ flex: 1, paddingTop: 10 }}>
              <TouchableOpacity style={styles.homeIcon} onPress={() => setAppState('home')}>
                <Text style={styles.homeIconText}>⌂</Text>
              </TouchableOpacity>
              <View style={{ marginTop: 130 }}>
                <Text style={styles.locationHeaderTop}>YOUR PROFILE</Text>
              </View>
              
              {selectedBird.idCard && (
                <View style={styles.profileIdCardContainer}>
                  <Image source={selectedBird.idCard} style={styles.profileIdCard} resizeMode="contain" />
                </View>
              )}
              
              <View style={styles.profileStatsContainer}>
                <View style={styles.profileStats}>
                  <Text style={styles.profileStatText}>Birds collected: 3/20</Text>
                  <Text style={styles.profileStatText}>Quests completed: 2</Text>
                  <Text style={styles.profileStatText}>Points retrieved: 30</Text>
                  <Text style={styles.profileStatText}>Questions answered: 1</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  };

  const renderChatScreen = () => {
    if (!selectedBird) return renderHomeScreen();
    
    const birdData = BIRD_CHAT_DATA[selectedBird.key];
    
    return (
      <View style={styles.mobileContainer}>
        <ImageBackground source={BG} resizeMode="cover" style={styles.bg} imageStyle={{ opacity: 1.0 }}>
          <SafeAreaView style={styles.safe}>
            <StatusBar style="dark" />
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.homeIcon} onPress={() => setAppState('home')}>
                <Text style={styles.homeIconText}>⌂</Text>
              </TouchableOpacity>
              
              {/* Bird Icon */}
              <View style={styles.chatIconContainer}>
                <Image source={birdData?.icon} style={styles.chatBirdIcon} resizeMode="contain" />
              </View>
              
              {/* Black overlay below icon */}
              <View style={styles.chatOverlay}>
                {/* Header with bird name */}
                <Text style={styles.chatBirdName}>{birdData?.name}</Text>
                <Text style={styles.chatSubtitle}>Your AI Bird Companion</Text>
                
                {/* Scrollable chat messages */}
                <View style={styles.chatMessagesWrapper}>
                  <FlatList
                    ref={chatScrollViewRef}
                    data={chatMessages}
                    keyExtractor={(item, index) => `msg-${index}`}
                    contentContainerStyle={styles.chatMessagesContainer}
                    renderItem={({ item }) => (
                      <View style={[styles.chatBubble, item.type === 'ai' ? styles.chatBubbleAi : styles.chatBubbleUser]}>
                        <Text style={[styles.chatBubbleText, item.type === 'ai' ? styles.chatBubbleTextAi : styles.chatBubbleTextUser]}>
                          {item.text}
                        </Text>
                      </View>
                    )}
                    onContentSizeChange={() => {
                      if (chatScrollViewRef.current && chatMessages.length > 0) {
                        setTimeout(() => {
                          chatScrollViewRef.current?.scrollToOffset({ offset: 999999, animated: true });
                        }, 100);
                      }
                    }}
                  />
                </View>
                
                {/* Input area */}
                <View style={styles.chatInputContainer}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Type your message..."
                    value={chatInput}
                    onChangeText={setChatInput}
                    onSubmitEditing={handleSendMessage}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <TouchableOpacity style={styles.chatSendButton} onPress={handleSendMessage}>
                    <Text style={styles.chatSendText}>Send</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Suggestions */}
                <View style={styles.chatSuggestions}>
                  <Text style={styles.chatSuggestionsTitle}>You can also ask...</Text>
                  <Text style={styles.chatSuggestion}>What are some actions harmful to birds?</Text>
                  <Text style={styles.chatSuggestion}>What is one local endangered bird species?</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  };

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
  return (
    <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Phone frame component with notch
  const PhoneFrame = ({ children }) => (
    <View style={styles.phoneFrame}>
      {/* Notch */}
      <View style={styles.notch} />
      {/* Reset button - small circle in top right */}
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={handleReset}
        activeOpacity={0.7}
      >
        <View style={styles.resetButtonCircle} />
      </TouchableOpacity>
      {/* Content area with safe zones */}
      <View style={styles.phoneContent}>
        {children}
      </View>
      {/* Bottom safe area indicator */}
      <View style={styles.bottomSafeArea} />
    </View>
  );

  return (
    <View style={styles.container}>
      <PhoneFrame>
        {appState === APP_STATES.QUIZ && renderQuizScreen()}
        {appState === APP_STATES.PROFILE_CREATION && renderProfileCreationScreen()}
        {appState === APP_STATES.LOADING_TRAM && renderLoadingTramScreen()}
        {appState === APP_STATES.TRAM_GAME && renderTramGameScreen()}
        {appState === 'home' && renderHomeScreen()}
        {appState === 'ar_mode' && renderArScreen()}
        {appState === 'quests' && renderQuestsScreen()}
        {appState === 'birds_collection' && renderBirdsCollectionScreen()}
        {appState === 'chat' && renderChatScreen()}
        {appState === 'profile' && renderProfileScreen()}
        {appState === 'tringa_home' && renderTringaHomeScreen()}
        {appState === 'shop' && renderShopScreen()}
      </PhoneFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  phoneFrame: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    backgroundColor: '#000',
    borderRadius: screenWidth > PHONE_WIDTH ? 20 : 0,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    maxWidth: PHONE_WIDTH,
    maxHeight: PHONE_HEIGHT,
  },
  notch: {
    position: 'absolute',
    top: 0,
    left: (PHONE_WIDTH - NOTCH_WIDTH) / 2,
    width: NOTCH_WIDTH,
    height: NOTCH_HEIGHT,
    backgroundColor: '#000',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 1000,
  },
  phoneContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingTop: NOTCH_HEIGHT,
    paddingBottom: 0,
    overflow: 'hidden',
    paddingHorizontal: 0,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SAFE_AREA,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  resetButton: {
    position: 'absolute',
    top: NOTCH_HEIGHT + 8,
    left: 16,
    width: 32,
    height: 32,
    zIndex: 2000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  mobileContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  bg: { 
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safe: { 
    flex: 1, 
    paddingHorizontal: 20,
    paddingTop: TOP_TEXT_SAFE_ZONE,
    paddingBottom: BOTTOM_TEXT_SAFE_ZONE,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  resultsHeader: {
    justifyContent: 'flex-end',
  },
  logoutButtonResults: {
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#073b4c',
    fontFamily: 'EtnaSansSerif',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
  },
  loginCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 20,
    marginHorizontal: 16,
  },
  nameCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 16,
  },
  quizContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  resultContentScroll: {
    flexGrow: 1,
    paddingBottom: BOTTOM_TEXT_SAFE_ZONE,
  },
  resultContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20,
    marginTop: 0,
  },
  resultTitle: {
    fontSize: 34,
    fontWeight: '400',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  birdTypeTitle: {
    fontSize: 44,
    fontWeight: '400',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: -8,
  },
  largeBirdImg: {
    width: 260,
    height: 360,
    borderRadius: 16,
  },
  resultIdCard: {
    marginTop: 0,
    alignSelf: 'center',
  },
  profileCreationContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 20,
  },
  idCardWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idCardImage: {
    width: MOBILE_WIDTH * 0.85,
    height: MOBILE_WIDTH * 0.85 * 1.6,
    borderRadius: 16,
  },
  welcomeUserText: {
    fontSize: 28,
    fontWeight: '400',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginVertical: 10,
  },
  appTitle: { 
    fontSize: 28, 
    fontWeight: '400', 
    color: '#073b4c',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'AncaCoder',
  },
  loginButtons: {
    width: '100%',
    gap: 12,
  },
  signUpButton: {
    backgroundColor: '#118ab2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  logInButton: {
    backgroundColor: '#073b4c',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  nameInput: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    fontFamily: 'CodecPro',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxChecked: {
    backgroundColor: '#e6f2ff',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: '#073b4c',
    fontFamily: 'CodecPro',
  },
  continueButton: {
    backgroundColor: '#118ab2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'CodecPro',
  },
  title: { 
    fontSize: 30, 
    fontWeight: '400', 
    color: 'white',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  progress: { 
    fontSize: 14, 
    color: '#3a3a3a', 
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'CodecPro',
  },
  prompt: { 
    fontSize: 20, 
    color: 'white',
    textAlign: 'center',
    fontFamily: 'CodecPro',
    fontWeight: 'bold',
    lineHeight: 24.1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  titleGradient: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  promptGradient: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#118ab2',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'CodecPro',
  },
  option: { 
    backgroundColor: '#118ab2', 
    padding: 14, 
    borderRadius: 12, 
    marginVertical: 8,
    marginHorizontal: 12,
    alignSelf: 'stretch',
    minHeight: 48,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  optionText: { 
    fontSize: 14, 
    color: 'white',
    fontFamily: 'CodecPro',
    lineHeight: 18,
    fontWeight: '700',
  },
  birdCard: { 
    width: 240, 
    alignItems: 'center',
  },
  birdImg: { 
    width: 200, 
    height: 140,
  },
  birdName: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'CodecPro',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  blurb: { 
    textAlign: 'center', 
    color: '#333', 
    marginVertical: 8,
    fontSize: 14,
    fontFamily: 'CodecPro',
    lineHeight: 18,
  },
  primary: { 
    backgroundColor: '#118ab2', 
    borderRadius: 12, 
    paddingVertical: 14, 
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    width: PHONE_WIDTH * 0.7,
    marginTop: 10,
  },
  primaryText: { 
    color: 'white', 
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'CodecPro',
  },
  secondary: { 
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#118ab2',
    borderRadius: 12,
    width: MOBILE_WIDTH * 0.7,
  },
  secondaryText: { 
    color: '#118ab2', 
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'AncaCoder',
  },
  blurbContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 30,
  },
  birdBlurbText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'CodecPro',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTramText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'CodecPro',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tramContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: -20,
    gap: 15,
    paddingBottom: 40,
  },
  locationHeaderTop: {
    fontSize: 38,
    fontWeight: '400',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  locationHeaderSub: {
    fontSize: 26,
    fontWeight: '400',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 10,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'AncaCoder',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: -5,
    marginBottom: 20,
  },
  tramQuestion: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'CodecPro',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: -60,
    marginBottom: 14,
  },
  tramOptions: {
    gap: 2,
    width: '100%',
  },
  tramOption: {
    padding: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 2,
    marginHorizontal: 8,
    minHeight: 28,
    width: '85%',
    alignSelf: 'center',
  },
  tramOptionText: {
    fontSize: 13,
    lineHeight: 16,
  },
  healArea: {
    alignSelf: 'center',
    width: MOBILE_WIDTH * 0.95,
    height: MOBILE_WIDTH * 0.95,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -66,
    marginBottom: 12,
  },
  healImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  healImageQuestion: {
    width: '100%',
    height: '100%',
  },
  aura: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(180,240,120,0.35)',
    filter: 'blur(6px)',
  },
  aura1: { width: 90, height: 90, top: 40, left: 40 },
  aura2: { width: 65, height: 65, bottom: 40, right: 40, backgroundColor: 'rgba(255,255,120,0.35)' },
  aura3: { width: 45, height: 45, top: 50, right: 50, backgroundColor: 'rgba(190,255,160,0.35)' },
  wrongAura: {
    position: 'absolute',
    width: MOBILE_WIDTH * 0.7,
    height: MOBILE_WIDTH * 0.7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,50,50,0.4)',
    filter: 'blur(20px)',
    alignSelf: 'center',
  },
  tramResultText: {
    color: 'white',
    fontFamily: 'CodecPro',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  resultOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: -25,
    alignSelf: 'center',
    width: '75%',
  },
  homeIcon: {
    position: 'absolute',
    right: 16,
    top: 8,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    zIndex: 1000,
  },
  homeIconText: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'EtnaSansSerif',
  },
  homeButtons: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 125,
  },
  arContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  arSwitch: {
    position: 'absolute',
    top: 10,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    zIndex: 1000,
  },
  arBird: {
    position: 'absolute',
    zIndex: 100,
  },
  arBirdImg: {
    width: MOBILE_WIDTH * 0.4,
    height: MOBILE_WIDTH * 0.4,
  },
  arBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 50,
  },
  homeBtn: {
    backgroundColor: '#118ab2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: MOBILE_WIDTH * 0.6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  btnConnectTram: {
    position: 'absolute',
    left: 164/375 * PHONE_WIDTH,
    top: Math.min(547/812 * PHONE_HEIGHT, PHONE_HEIGHT - NOTCH_HEIGHT - BOTTOM_SAFE_AREA - 60),
    backgroundColor: '#118ab2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnArMode: {
    position: 'absolute',
    left: 297/375 * PHONE_WIDTH,
    top: Math.min(993/812 * PHONE_HEIGHT, PHONE_HEIGHT - NOTCH_HEIGHT - BOTTOM_SAFE_AREA - 60),
    backgroundColor: '#118ab2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnQuests: {
    position: 'absolute',
    left: Math.min(413/375 * PHONE_WIDTH, PHONE_WIDTH - 100),
    top: Math.min(1325/812 * PHONE_HEIGHT, PHONE_HEIGHT - NOTCH_HEIGHT - BOTTOM_SAFE_AREA - 60),
    backgroundColor: '#118ab2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  bottomNav: {
    position: 'absolute',
    bottom: BOTTOM_TEXT_SAFE_ZONE + 12,
    left: 16,
    right: 16,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  navIcon: { color: 'white', fontSize: 18 },
  navIconLarge: { 
    color: 'white', 
    fontSize: 28,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  homeLogoutButton: {
    position: 'absolute',
    left: 10,
    top: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    zIndex: 1000,
  },
  bottomBanner: {
    position: 'absolute',
    bottom: BOTTOM_TEXT_SAFE_ZONE + 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 10,
    maxWidth: PHONE_WIDTH - 32,
  },
  birdPlaceholder: {
    alignSelf: 'center',
    width: MOBILE_WIDTH * 0.7,
    height: MOBILE_WIDTH * 0.7,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    marginBottom: 12,
  },
  birdCollectionContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    marginTop: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: PHONE_HEIGHT - NOTCH_HEIGHT - BOTTOM_SAFE_AREA - 200,
  },
  birdCollectionImage: {
    width: '100%',
    height: '100%',
  },
  chatIconContainer: {
    alignItems: 'center',
    paddingTop: 33,
    paddingBottom: 10,
  },
  chatBirdIcon: {
    width: 100,
    height: 100,
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
  },
  chatBirdName: {
    fontSize: 38,
    fontWeight: '400',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  chatSubtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'CodecPro',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 16,
  },
  chatMessagesWrapper: {
    flex: 1,
    minHeight: 200,
    maxHeight: 300,
  },
  chatMessagesContainer: {
    paddingBottom: 10,
  },
  chatBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
  },
  chatBubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e3a5f',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffb3d1',
  },
  chatBubbleText: {
    fontSize: 15,
    fontFamily: 'CodecPro',
    lineHeight: 20,
  },
  chatBubbleTextAi: {
    color: 'white',
  },
  chatBubbleTextUser: {
    color: '#000',
  },
  chatInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: 'white',
    fontFamily: 'CodecPro',
    fontSize: 14,
  },
  chatSendButton: {
    backgroundColor: '#118ab2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  chatSendText: {
    color: 'white',
    fontFamily: 'CodecPro',
    fontWeight: '600',
    fontSize: 14,
  },
  chatSuggestions: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  chatSuggestionsTitle: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'CodecPro',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  chatSuggestion: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'EtnaSansSerif',
    marginVertical: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  tramPopup: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minWidth: MOBILE_WIDTH * 0.8,
    maxWidth: MOBILE_WIDTH * 0.9,
    marginHorizontal: 20,
    gap: 16,
  },
  popupHint: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'CodecPro',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#073b4c',
    textAlign: 'center',
    fontFamily: 'EtnaSansSerif',
  },
  popupCloseButton: {
    backgroundColor: '#118ab2',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 8,
  },
  popupCloseText: {
    color: 'white',
    fontFamily: 'CodecPro',
    fontWeight: '600',
    fontSize: 16,
  },
  profileIdCardContainer: {
    alignItems: 'center',
    marginTop: -80,
    marginBottom: 24,
  },
  profileIdCard: {
    width: MOBILE_WIDTH * 0.9,
    height: MOBILE_WIDTH * 0.9 * 1.6,
    borderRadius: 16,
  },
  profileStatsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -165,
  },
  profileStats: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 20,
    paddingHorizontal: 24,
    gap: 16,
    minWidth: MOBILE_WIDTH * 0.8,
  },
  profileStatText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'CodecPro',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tringaImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  tringaImage: {
    width: MOBILE_WIDTH * 0.7,
    height: MOBILE_WIDTH * 0.7,
  },
  tringaBottomNav: {
    position: 'absolute',
    bottom: BOTTOM_TEXT_SAFE_ZONE + 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  tringaNavButton: {
    backgroundColor: '#118ab2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tringaEmoji: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  tringaEmojiText: {
    fontSize: 48,
    textAlign: 'center',
  },
  shopSubheading: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'CodecPro',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
    marginTop: 8,
  },
  tringaBottomNavExpanded: {
    height: 80,
    paddingVertical: 16,
  },
  tringaNavCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tringaNavCloseText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tringaExpandedContent: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 20,
    minHeight: 150,
    maxHeight: 300,
  },
  inventoryContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  wormItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  wormImage: {
    width: MOBILE_WIDTH * 0.12,
    height: MOBILE_WIDTH * 0.12,
  },
  wormImageGrayscale: {
    opacity: 0.5,
    tintColor: '#999',
  },
  wormItemTitle: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'CodecPro',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wormItemPrice: {
    fontSize: 12,
    color: '#ffd700',
    fontFamily: 'CodecPro',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tasksContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    padding: 20,
    minHeight: MOBILE_WIDTH * 0.3,
  },
  statsCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  statsCloseButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  expandedContentText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'CodecPro',
    textAlign: 'center',
  },
  popupSubheading: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'CodecPro',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  statBarContainer: {
    width: '100%',
    marginVertical: 12,
  },
  statLabel: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'EtnaSansSerif',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statBarOuter: {
    width: '100%',
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  statBarInner: {
    height: '100%',
    backgroundColor: '#118ab2',
    borderRadius: 12,
  },
  statPercentage: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'CodecPro',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  spongeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MOBILE_WIDTH * 0.3,
    position: 'relative',
    paddingVertical: 10,
  },
  spongeEmojiWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 28,
  },
  spongeItemDragging: {
    opacity: 0.8,
  },
  spongeEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  resultsBeginButton: {
    marginTop: 20,
    marginBottom: 0,
    alignSelf: 'center',
  },
  spongeLabel: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'CodecPro',
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});