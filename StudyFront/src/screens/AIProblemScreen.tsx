import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity, Platform, Modal, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, type ImageLibraryOptions } from 'react-native-image-picker';
import { listLibrary, getSignedUrl } from '../logic/library';

// THEME — align with app palette
const BG = '#F6F7FB';
const SURFACE = '#FFFFFF';
const CARD_SOFT = '#FDFEFE';
const ACCENT = '#FF8A00';
const ACCENT_SOFT = '#FFF1E0';
const INK = '#0B1220';
const SUBTLE = '#5B667A';
const BORDER = '#E6E8EE';
const SHADOW = { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 0.5 } as const;

type Props = { navigation: any };
type Selected = { source: 'phone' | 'library'; name: string; uri?: string; path?: string } | null;

const LIB_OPTS: ImageLibraryOptions = {
  mediaType: 'photo',
  selectionLimit: 1,
  includeExtra: false,
  quality: 0.9,
};

export default function AIProblemScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Selected>(null);
  const [libVisible, setLibVisible] = useState(false);
  const [loadingLib, setLoadingLib] = useState(false);
  const [libItems, setLibItems] = useState<Array<{ name: string; id?: string; path: string }>>([]);

  const openGallery = async () => {
    const res = await launchImageLibrary(LIB_OPTS);
    const asset = res.assets?.[0];
    if (asset?.uri) {
      setSelected({ source: 'phone', name: asset.fileName || 'gallery.jpg', uri: asset.uri });
    }
  };

  const openLibraryModal = async () => {
    setLibVisible(true);
    setLoadingLib(true);
    try {
      const list = await listLibrary();
      const items = (list || []).map((it: any) => ({ name: it.name as string, path: it.name as string }));
      setLibItems(items);
    } catch (e) {
      setLibItems([]);
    } finally {
      setLoadingLib(false);
    }
  };

  const chooseFromLibrary = async (item: { name: string; path: string }) => {
    // We keep only path and name for now; signed URL can be generated later when needed
    setSelected({ source: 'library', name: item.name, path: item.path });
    setLibVisible(false);
  };

  const TopBar = () => (
    <View style={{ backgroundColor: BG, borderBottomColor: BORDER, borderBottomWidth: 1 }}>
      <View style={{ paddingTop: insets.top, backgroundColor: BG }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', left: 6, top: 10, padding: 6 }}>
            <MaterialIcons name="arrow-back" size={24} color={INK} />
          </TouchableOpacity>
          <Text style={{ fontSize: 19, fontWeight: '900', color: INK }}>AI 문제 생성</Text>
          <TouchableOpacity
            onPress={() => {
              // HomeStack 내부에 등록된 MyAIProblems로 이동 시도, 실패 시 루트에서 시도
              try {
                navigation.navigate('MyAIProblems');
              } catch {
                navigation.getParent?.()?.navigate?.('MyAIProblems');
              }
            }}
            style={{ position: 'absolute', right: 6, top: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: ACCENT_SOFT, borderWidth: 1, borderColor: BORDER }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: ACCENT }}>내가 만든 AI 문제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <TopBar />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: INK, marginBottom: 12 }}>자료 선택</Text>

        {/* 내 휴대폰에서 가져오기 */}
        <TouchableOpacity
          onPress={openGallery}
          style={{ width: '100%', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 14, ...SHADOW }}
        >
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT_SOFT, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER }}>
            <MaterialIcons name="photo-library" size={26} color={ACCENT} />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>내 휴대폰에서 가져오기</Text>
            <Text style={{ fontSize: 12, color: SUBTLE, marginTop: 4, lineHeight: 16 }}>갤러리의 이미지를 선택해요</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={SUBTLE} />
        </TouchableOpacity>

        {/* 자료함에서 가져오기 */}
        <TouchableOpacity
          onPress={openLibraryModal}
          style={{ width: '100%', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', ...SHADOW }}
        >
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT_SOFT, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER }}>
            <MaterialIcons name="folder-open" size={26} color={ACCENT} />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>자료함에서 가져오기</Text>
            <Text style={{ fontSize: 12, color: SUBTLE, marginTop: 4, lineHeight: 16 }}>앱 내 자료함의 PDF/이미지 선택</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={SUBTLE} />
        </TouchableOpacity>

        {/* 선택 미리보기 */}
        {selected && (
          <View style={{ marginTop: 18 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: INK, marginBottom: 8 }}>선택된 자료</Text>
            <View style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 16, ...SHADOW }}>
              {selected.source === 'phone' && selected.uri ? (
                <Image source={{ uri: selected.uri }} style={{ width: '100%', height: 220, borderRadius: 12, backgroundColor: '#EEE' }} resizeMode="contain" />
              ) : (
                <View style={{ height: 120, borderRadius: 12, backgroundColor: '#FAFAFC', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="insert-drive-file" size={44} color={ACCENT} />
                  <Text style={{ fontSize: 12, marginTop: 6, color: SUBTLE }}>{selected.name}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {/* TODO: hook AI generation start */}}
                disabled={!selected}
                style={{ marginTop: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>문제 생성 시작</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 자료함 선택 모달 */}
      <Modal visible={libVisible} transparent animationType="fade" onRequestClose={() => setLibVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 16, maxHeight: '70%' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: INK }}>자료함에서 선택</Text>
            {loadingLib ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <ActivityIndicator color={ACCENT} />
                <Text style={{ marginTop: 8, fontSize: 12, color: SUBTLE }}>불러오는 중...</Text>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 10 }}>
                {libItems.length === 0 ? (
                  <Text style={{ fontSize: 12, color: SUBTLE }}>자료함에 파일이 없습니다.</Text>
                ) : (
                  libItems.map((it) => (
                    <TouchableOpacity key={it.path} onPress={() => chooseFromLibrary(it)} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                      <Text style={{ fontSize: 13, color: INK, fontWeight: '700' }}>{it.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setLibVisible(false)} style={{ marginTop: 12, alignSelf: 'stretch', paddingVertical: 10, borderRadius: 12, backgroundColor: ACCENT_SOFT, borderWidth: 1, borderColor: BORDER, alignItems: 'center' }}>
              <Text style={{ color: ACCENT, fontWeight: '800' }}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
