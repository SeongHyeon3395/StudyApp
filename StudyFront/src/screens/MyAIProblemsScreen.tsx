import React from 'react';
import { View, Text, SafeAreaView, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const BG = '#F6F7FB';
const SURFACE = '#FFFFFF';
const ACCENT = '#FF8A00';
const SUBTLE = '#5B667A';
const BORDER = '#E6E8EE';
const INK = '#0B1220';
const SHADOW = { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 0.5 } as const;

export default function MyAIProblemsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={{ flex:1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <View style={{ backgroundColor: BG, borderBottomColor: BORDER, borderBottomWidth: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent:'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', left: 6, top: 10, padding: 6 }}>
            <MaterialIcons name="arrow-back" size={24} color={INK} />
          </TouchableOpacity>
          <Text style={{ fontSize: 19, fontWeight: '900', color: INK }}>내가 만든 AI 문제</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }}>
        <View style={{ alignItems:'center', marginTop: 40 }}>
          <MaterialIcons name="quiz" size={40} color={ACCENT} />
          <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '900', color: INK }}>아직 생성한 문제가 없어요</Text>
          <Text style={{ marginTop: 6, fontSize: 12, color: SUBTLE }}>AI 문제 생성에서 만들어보세요.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
