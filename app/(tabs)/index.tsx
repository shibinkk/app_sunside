import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Welcome to Home</Text>

      <View style={styles.welcomeContainer}>
        <View style={styles.catContainer}>
          <View style={styles.cat}>
            <View style={styles.catEar} />
            <View style={styles.catEar} />
            <View style={styles.catFace}>
              <View style={styles.catEye} />
              <View style={styles.catEye} />
              <View style={styles.catNose} />
            </View>
          </View>
        </View>

        <Text style={styles.welcomeText}>
          <Text style={styles.welcomeLetterDark}>W</Text>
          <Text style={styles.welcomeLetterDark}>E</Text>
          <Text style={styles.welcomeLetterPink}>L</Text>
          <Text style={styles.welcomeLetterPink}>C</Text>
          <Text style={styles.welcomeLetterPink}>O</Text>
          <Text style={styles.welcomeLetterDark}>M</Text>
          <Text style={styles.welcomeLetterDark}>E</Text>
        </Text>

        <View style={styles.catContainer}>
          <View style={styles.cat}>
            <View style={styles.catEar} />
            <View style={styles.catEar} />
            <View style={styles.catFace}>
              <View style={styles.catEye} />
              <View style={styles.catEye} />
              <View style={styles.catNose} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.dotsContainer}>
        <View style={[styles.dot, styles.dotPink]} />
        <View style={[styles.dot, styles.dotPink]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 60,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  catContainer: {
    marginHorizontal: 12,
  },
  cat: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  catEar: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2D2D3D',
    position: 'absolute',
    top: 0,
  },
  catFace: {
    width: 50,
    height: 50,
    backgroundColor: '#2D2D3D',
    borderRadius: 25,
    position: 'absolute',
    top: 10,
    left: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEye: {
    width: 6,
    height: 6,
    backgroundColor: '#FF6B9D',
    borderRadius: 3,
    marginHorizontal: 4,
  },
  catNose: {
    width: 4,
    height: 4,
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 4,
  },
  welcomeLetterDark: {
    color: '#2D2D3D',
  },
  welcomeLetterPink: {
    color: '#FF6B9D',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotPink: {
    backgroundColor: '#FFB3C6',
  },
});
