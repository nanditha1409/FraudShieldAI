import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ==============================
// API CONFIG (MANDATORY SHAPE)
// ==============================
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000',
  API_KEY: process.env.EXPO_PUBLIC_API_KEY || 'fraud_detection_api_key_2026',
  TIMEOUT: 60000,
  ENDPOINTS: {
    HEALTH: '/health',
    ANALYZE_TEXT: '/analyze',
    ANALYZE_AUDIO: '/analyze',
  },
};

// Risk level colors and thresholds
export const RISK_LEVELS = {
  LOW: { color: '#4CAF50', threshold: 0.3 },
  MEDIUM: { color: '#FF9800', threshold: 0.7 },
  HIGH: { color: '#F44336', threshold: 1.0 },
};

export const getRiskLevel = (score) => {
  if (score <= RISK_LEVELS.LOW.threshold) return 'LOW';
  if (score <= RISK_LEVELS.MEDIUM.threshold) return 'MEDIUM';
  return 'HIGH';
};

export const getRiskColor = (level) => {
  return RISK_LEVELS[level]?.color || RISK_LEVELS.MEDIUM.color;
};

// ==============================
// Simple Web-Only Speech Hook
// (Graceful fallback on mobile)
// ==============================
const useSimpleSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Web-only, safe guard for Expo Go mobile
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            if (event.results[i].isFinal) {
              finalText += event.results[i][0].transcript;
            }
          }
          if (finalText) {
            setTranscript((prev) => {
              const next = (prev + ' ' + finalText).trim();
              return next.slice(-4000);
            });
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        setSupported(true);
      }
    }
  }, []);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Ignore repeated start errors
      }
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    supported,
    start,
    stop,
    setTranscript,
  };
};

// ==============================
// Main App Component
// ==============================
export default function App() {
  const {
    isListening,
    transcript,
    supported: sttSupported,
    start,
    stop,
    setTranscript,
  } = useSimpleSpeechRecognition();

  const [transcriptText, setTranscriptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [errorMessage, setErrorMessage] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    if (transcript && transcript !== transcriptText) {
      setTranscriptText(transcript);
    }
  }, [transcript, transcriptText]);

  const fetchWithTimeout = async (url, options = {}, timeoutMs = API_CONFIG.TIMEOUT) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(id);
    }
  };

  const startListening = () => {
    setErrorMessage('');
    setAnalysisResult(null);
    setTranscriptText('');
    setTranscript('');

    if (Platform.OS === 'web') {
      if (!sttSupported) {
        setErrorMessage(
          'Live speech recognition is not supported in this browser. You can still type your transcript manually below.'
        );
        return;
      }
      start();
    } else {
      setErrorMessage(
        'Live speech recognition is not available in this Expo Go build. Please type the transcript manually, then tap "Stop & Analyze".'
      );
    }
  };

  const stopListening = () => {
    if (Platform.OS === 'web') {
      stop();
    }
  };

  const analyzeTranscript = async () => {
    const trimmed = transcriptText.trim();
    
    // Validate transcript before sending
    if (!trimmed || trimmed.length === 0) {
      setErrorMessage('Please provide a transcript before analyzing.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANALYZE_TEXT}`;
      
      // Debug logging
      console.log("Calling endpoint:", url);
      console.log("Request payload:", { text: trimmed });

      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_CONFIG.API_KEY,
          },
          body: JSON.stringify({
            textInput: trimmed,
          }),
        },
        API_CONFIG.TIMEOUT
      );

      // Debug logging
      console.log("Response status:", response.status);

      if (response.status !== 200) {
        console.log("API ERROR STATUS:", response.status);
        let msg = `Backend error (${response.status})`;
        try {
          const errData = await response.json();
          console.log("Error response:", errData);
          if (errData?.error) {
            msg = errData.error;
          } else if (errData?.detail) {
            msg = errData.detail;
          }
        } catch (_) {
          const textError = await response.text();
          console.log("Error response (text):", textError);
          msg = textError || msg;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      console.log("API RESPONSE:", data);

      // Map Flask backend response
      const classification = (data.classification || 'SAFE').toUpperCase();
      const confidence = data.confidence || 0;
      const riskScore = Math.round(confidence * 100);
      const isFraud = classification === 'FRAUD';
      const reason = data.reason || 'No explanation available';
      
      // Determine risk level
      let riskLevel;
      if (riskScore <= 30) {
        riskLevel = 'LOW';
      } else if (riskScore <= 70) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'HIGH';
      }
      
      const verdict = isFraud ? "Fraud Likely" : "Safe Conversation";
      const explanation = reason;
      const alertRequired = isFraud || false;

      setRiskLevel(riskLevel);

      const result = {
        risk_score: riskScore / 100,
        verdict: verdict,
        explanation: explanation,
        matched_keywords: data.matched_keywords || [],
        alert_required: alertRequired,
        transcript: transcriptText,
      };

      setAnalysisResult(result);

      if (result.alert_required) {
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      if (error?.name === 'AbortError') {
        setErrorMessage(
          'The request to the FraudShield AI backend timed out. Please try again.'
        );
      } else {
        setErrorMessage(
          error?.message?.includes('network')
            ? 'Unable to reach the FraudShield AI backend. Please check your connection and try again.'
            : error?.message || 'Something went wrong while analyzing the transcript.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderRiskBanner = () => {
    if (!analysisResult) return null;
    const bgColor = getRiskColor(riskLevel);

    let bannerText = 'Low risk detected. Stay vigilant.';
    if (riskLevel === 'MEDIUM') {
      bannerText = 'Medium risk detected. Please exercise caution.';
    } else if (riskLevel === 'HIGH') {
      bannerText = 'High risk detected. Consider ending this call immediately.';
    }

    return (
      <View style={[styles.alertBanner, { backgroundColor: `${bgColor}DD` }]}>
        <Text style={styles.alertBannerText}>{bannerText}</Text>
      </View>
    );
  };

  const renderRiskIndicator = () => {
    const score = analysisResult?.risk_score ?? 0;
    const percentage = Math.round(score * 100);
    const color = getRiskColor(riskLevel);

    return (
      <View style={styles.riskContainer}>
        <View style={[styles.riskOuterRing, { borderColor: `${color}66` }]}>
          <View style={[styles.riskMiddleRing, { borderColor: `${color}99` }]}>
            <View style={[styles.riskInnerCircle, { backgroundColor: `${color}33` }]}>
              <Text style={[styles.riskScoreText, { color }]}>{percentage}%</Text>
              <Text style={styles.riskLabelText}>{riskLevel} RISK</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderKeywords = () => {
    if (!analysisResult || !analysisResult.matched_keywords?.length) {
      return (
        <Text style={styles.noKeywordsText}>
          No specific suspicious keywords were highlighted.
        </Text>
      );
    }

    return (
      <View style={styles.keywordContainer}>
        {analysisResult.matched_keywords.map((kw, idx) => (
          <View key={`${kw}-${idx}`} style={styles.keywordTag}>
            <Text style={styles.keywordText}>{kw}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#050716', '#050716', '#15192f']}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        <View style={styles.blobPurple} />
        <View style={styles.blobCyan} />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>FraudShield AI</Text>
            <Text style={styles.subtitle}>
              Real-time voice fraud detection, powered by AI.
            </Text>
          </View>

          {renderRiskBanner()}

          <View style={styles.card}>
            <ScrollView
              style={styles.cardScroll}
              contentContainerStyle={styles.cardScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.voiceControls}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isListening && styles.primaryButtonActive,
                  ]}
                  onPress={startListening}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    🎙️ {isListening ? 'Listening...' : 'Start Listening'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    isLoading && styles.secondaryButtonDisabled,
                  ]}
                  onPress={() => {
                    stopListening();
                    analyzeTranscript();
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Stop &amp; Analyze</Text>
                </TouchableOpacity>
              </View>

              {Platform.OS !== 'web' && (
                <Text style={styles.infoText}>
                  Live speech recognition is limited in Expo Go. You can still manually
                  type your transcript below and analyze it.
                </Text>
              )}

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Live Transcript</Text>
                <TextInput
                  style={styles.transcriptInput}
                  multiline
                  placeholder="Your spoken conversation will appear here, or you can type to test FraudShield AI..."
                  placeholderTextColor="#8A8FA5"
                  value={transcriptText}
                  onChangeText={(text) => {
                    setTranscriptText(text);
                    setTranscript(text);
                  }}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Analysis Results</Text>
                {analysisResult ? (
                  <View>
                    {renderRiskIndicator()}

                    <View style={styles.resultBlock}>
                      <Text style={styles.resultTitle}>Verdict</Text>
                      <Text style={styles.resultText}>
                        {analysisResult.verdict || 'No verdict provided.'}
                      </Text>
                    </View>

                    <View style={styles.resultBlock}>
                      <Text style={styles.resultTitle}>Explanation</Text>
                      <Text style={styles.resultText}>
                        {analysisResult.explanation ||
                          'The backend did not provide an explanation.'}
                      </Text>
                    </View>

                    <View style={styles.resultBlock}>
                      <Text style={styles.resultTitle}>Matched Keywords</Text>
                      {renderKeywords()}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noResultsText}>
                    No analysis yet. Start talking, then tap &quot;Stop &amp; Analyze&quot;
                    to see fraud risk insights here.
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2026 FraudShield AI – Hackathon Prototype
            </Text>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={styles.loadingText}>Analyzing...</Text>
          </View>
        )}

        <Modal
          visible={alertVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAlertVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>⚠️ Potential Fraud Detected</Text>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalLabel}>Verdict</Text>
                <Text style={styles.modalText}>
                  {analysisResult?.verdict || 'No verdict provided.'}
                </Text>

                <Text style={[styles.modalLabel, { marginTop: 16 }]}>
                  Explanation
                </Text>
                <Text style={styles.modalText}>
                  {analysisResult?.explanation ||
                    'No explanation was provided by the backend.'}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setAlertVisible(false)}
              >
                <Text style={styles.modalButtonText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#B9BEDA',
  },
  card: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: 'rgba(8, 10, 30, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(120, 130, 255, 0.25)',
    padding: 16,
    overflow: 'hidden',
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    paddingBottom: 16,
  },
  voiceControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#3D5AFE',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonActive: {
    backgroundColor: '#5C6BC0',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#8E99F3',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: '#E8EAFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#9EA3C7',
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 67, 54, 0.12)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.5)',
    marginBottom: 12,
  },
  errorText: {
    color: '#FF8A80',
    fontSize: 12,
  },
  section: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD0FF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  transcriptInput: {
    minHeight: 110,
    maxHeight: 200,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.5)',
    padding: 10,
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: 'rgba(12, 16, 48, 0.9)',
  },
  noResultsText: {
    fontSize: 13,
    color: '#8F94B8',
  },
  riskContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  riskOuterRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskMiddleRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskScoreText: {
    fontSize: 26,
    fontWeight: '700',
  },
  riskLabelText: {
    marginTop: 4,
    fontSize: 13,
    color: '#E0E4FF',
  },
  resultBlock: {
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D0D4FF',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 13,
    color: '#E3E6FF',
    lineHeight: 18,
  },
  noKeywordsText: {
    fontSize: 13,
    color: '#9EA3C7',
  },
  keywordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  keywordTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.6)',
    marginRight: 6,
    marginTop: 4,
  },
  keywordText: {
    fontSize: 12,
    color: '#CCF4FF',
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#7A7FA0',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 7, 22, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#E0E4FF',
    fontSize: 14,
  },
  alertBanner: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  alertBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 5, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: 'rgba(10, 14, 40, 0.98)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.7)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFCDD2',
    marginBottom: 8,
  },
  modalBody: {
    marginTop: 4,
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFEBEE',
    marginBottom: 4,
  },
  modalText: {
    fontSize: 13,
    color: '#FCE4EC',
    lineHeight: 18,
  },
  modalButton: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  blobPurple: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(118, 75, 252, 0.5)',
    opacity: 0.6,
    transform: [{ rotate: '15deg' }],
  },
  blobCyan: {
    position: 'absolute',
    top: 160,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0, 229, 255, 0.35)',
    opacity: 0.7,
    transform: [{ rotate: '-18deg' }],
  },
});
