import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getConversationHistory } from '@/lib/firebase';
import { deities } from '@/data/deities';
import { Calendar, Clock, Search } from 'lucide-react-native';

type ConversationGroup = {
  date: string;
  conversations: any[];
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<ConversationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getConversationHistory(user?.uid || '');
      // const data = await getConversationHistory('');

      // Group conversations by date
      const groupedByDate: Record<string, any[]> = {};
      
      data.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push(item);
      });
      
      // Convert to array format for FlatList
      const historyArray = Object.keys(groupedByDate).map(date => ({
        date,
        conversations: groupedByDate[date].sort((a, b) => b.timestamp - a.timestamp)
      }));
      
      // Sort by most recent date first
      historyArray.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setHistory(historyArray);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationPress = (conversation:any) => {
    router.push({
      pathname: '/chat',
      params: { 
        deity: conversation.deityId,
        conversationId: conversation.id
      }
    });
  };

  const getDeityName = (deityId : string) => {
    const deity = deities.find(d => d.id === deityId);
    return deity ? deity.name : 'Unknown Deity';
  };

  const getDeityColor = (deityId : string) => {
    const deity = deities.find(d => d.id === deityId);
    return deity ? deity.color : '#8a4fff';
  };

  const formatTime = (timestamp : Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderDateHeader = ({ date }: { date: string }) => (
    <View style={styles.dateHeader}>
      <Calendar size={18} color="#e0e0e0" />
      <Text style={styles.dateText}>{date}</Text>
    </View>
  );

// Suggested code may be subject to a license. Learn more: ~LicenseLog:3938421981.
  const renderConversationItem = ({ item: conversation }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(conversation)}
    >
      <View style={[
        styles.deityIndicator, 
        { backgroundColor: getDeityColor(conversation.deityId) }
      ]} />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.deityName}>{getDeityName(conversation.deityId)}</Text>
          <View style={styles.timeContainer}>
            <Clock size={12} color="#a9a9a9" />
            <Text style={styles.timeText}>{formatTime(conversation.timestamp)}</Text>
          </View>
        </View>
        
        <Text style={styles.messagePreview} numberOfLines={2}>
          {conversation.userMessage?.text || 'Empty conversation'}
        </Text>
        
        <Text style={styles.responsePreview} numberOfLines={1}>
          {conversation.deityMessage?.text || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f0f1f']}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Conversation History</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a4fff" />
          <Text style={styles.loadingText}>Loading your divine conversations...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations found</Text>
          <Text style={styles.emptySubtext}>
            Start a new conversation with a deity from the Commune tab
          </Text>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={() => router.push('/chat')}
          >
            <Text style={styles.newChatButtonText}>Start New Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.dateGroup}>
              {renderDateHeader(item)}
              {item.conversations.map((conversation) => (
                <View key={conversation.id}>
                  {renderConversationItem({ item: conversation })}
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 24,
    color: '#ffffff',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 120,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dateText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#e0e0e0',
    marginLeft: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  deityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  deityName: {
    fontFamily: 'Playfair-Regular',
    fontSize: 16,
    color: '#ffffff',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#a9a9a9',
    marginLeft: 4,
  },
  messagePreview: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 4,
  },
  responsePreview: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#a9a9a9',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#e0e0e0',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Playfair-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#a9a9a9',
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatButton: {
    backgroundColor: '#8a4fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  newChatButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});