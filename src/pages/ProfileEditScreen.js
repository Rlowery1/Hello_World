// src/pages/ProfileEditScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { API, graphqlOperation, Auth } from 'aws-amplify';
import { createUserProfile, updateUserProfile } from '../graphql/mutations';
import { getUserProfile } from '../graphql/queries';
import GlobalStyles from '../styles/GlobalStyles';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingScreen from '../components/Loading';


const ProfileEditScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [workoutDays, setWorkoutDays] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const currentUser = await Auth.currentAuthenticatedUser();
        const ownerId = currentUser.attributes.sub;

        const userProfileData = await API.graphql(
          graphqlOperation(getUserProfile, { id: ownerId }),
        );
        const userProfile = userProfileData.data.getUserProfile;

        if (userProfile) {
          setName(userProfile.name);
          setAge(userProfile.age.toString());
          setWeight(userProfile.weight.toString());
          setHeight(userProfile.height.toString());
          setGender(userProfile.gender);
          setFitnessGoal(userProfile.fitnessGoal);
          setWorkoutDays(userProfile.workoutDays);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  const handleSubmit = async () => {
    if (name === '' || age === '' || weight === '' || height === '' || gender === '' || fitnessGoal === '' || workoutDays === '') {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      const ownerId = currentUser.attributes.sub;

      const input = {
        id: ownerId,
        name,
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        fitnessGoal,
        workoutDays,
      };

      const userProfileData = await API.graphql(
        graphqlOperation(getUserProfile, { id: ownerId }),
      );
      const userProfile = userProfileData.data.getUserProfile;

      if (userProfile) {
        await API.graphql(
          graphqlOperation(updateUserProfile, { input }),
        );
      } else {
        await API.graphql(
          graphqlOperation(createUserProfile, { input }),
        );
      }
      await AsyncStorage.setItem('workoutDays', workoutDays.toString());
      await AsyncStorage.setItem('fitnessGoal', fitnessGoal);

      Alert.alert('Profile saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error saving profile:', error.message);
    }
    setLoading(false);
  };

  if (loading) {
  return <LoadingScreen />;
}


  return (
    <SafeAreaView style={styles.container}>
<Text style={[GlobalStyles.title, styles.title]}>Edit Profile</Text>
<ScrollView contentContainerStyle={styles.scrollViewContainer}>
<TextInput
       style={styles.input}
       value={name}
       onChangeText={setName}
       placeholder="Name"
       placeholderTextColor="#FFFFFF"
     />
<TextInput
       style={styles.input}
       value={age}
       onChangeText={setAge}
       placeholder="Age"
       keyboardType="number-pad"
       placeholderTextColor="#FFFFFF"
     />
<TextInput
       style={styles.input}
       value={weight}
       onChangeText={setWeight}
       placeholder="Weight (kg)"
       keyboardType="number-pad"
       placeholderTextColor="#FFFFFF"
     />
<TextInput
       style={styles.input}
       value={height}
       onChangeText={setHeight}
       placeholder="Height (cm)"
       keyboardType="number-pad"
       placeholderTextColor="#FFFFFF"
     />
          <View style={styles.inputContainer}>
      <RNPickerSelect
        onValueChange={(value) => setGender(value)}
        items={[          { label: 'Male', value: 'Male' },          { label: 'Female', value: 'Female' },          { label: 'Other', value: 'Other' },        ]}
        value={gender}
        placeholder={{ label: 'Gender', value: null }}
        style={pickerSelectStyles}
      />
    </View>
    <View style={styles.inputContainer}>
      <RNPickerSelect
        onValueChange={(value) => setFitnessGoal(value)}
        items={[          { label: 'Gain', value: 'Gain' },          { label: 'Cut', value: 'Cut' },          { label: 'Strength', value: 'Strength' },        ]}
        value={fitnessGoal}
        placeholder={{ label: 'Fitness Goal', value: null }}
        style={pickerSelectStyles}
      />
    </View>
    <View style={styles.inputContainer}>
      <RNPickerSelect
        onValueChange={(value) => setWorkoutDays(value)}
        items={[          { label: '3', value: 3 },          { label: '4', value: 4 },          { label: '5', value: 5 },          { label: '6', value: 6 },          { label: '7', value: 7 },        ]}
        value={workoutDays}
        placeholder={{ label: 'Days To Workout', value: null }}
        style={pickerSelectStyles}
      />
    </View>
    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
      <Text style={[GlobalStyles.title, styles.buttonText]}>Save</Text>
    </TouchableOpacity>
  </ScrollView>
</SafeAreaView>
);
};

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#1A1A1D',
paddingTop: 20,
},
scrollViewContainer: {
alignItems: 'center',
},
input: {
width: '80%',
height: 40,
borderColor: '#ccc',
borderWidth: 1,
borderRadius: 5,
paddingHorizontal: 10,
marginBottom: 10,
backgroundColor: '#1A1A1D',
fontSize: 16,
color: '#FFFFFF',
},
button: {
backgroundColor: '#0E7C7B',
paddingHorizontal: 40,
paddingVertical: 5,
borderRadius: 5,
marginTop: 15,
width: '50%',
},
inputContainer: {
width: '80%',
marginBottom: 10,
},
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
fontSize: 16,
paddingHorizontal: 10,
paddingVertical: 5,
borderWidth: 1,
borderColor: '#ccc',
borderRadius: 5,
color: 'white',
paddingRight: 30,
width: '100%',
height: 40,
marginBottom: 10,
backgroundColor: '#1A1A1D',
},
inputAndroid: {
fontSize: 16,
paddingHorizontal: 10,
paddingVertical: 5,
borderWidth: 1,
borderColor: '#ccc',
borderRadius: 5,
color: 'white',
paddingRight: 30,
width: '100%',
height: 40,
marginBottom: 10,
backgroundColor: '#1A1A1D',
},
loadingContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
backgroundColor: '#1A1A1D',
},

loadingText: {
fontSize: 18,
color: '#E6E6E6',
marginTop: 10,
},
title: {
fontSize: 24,
fontWeight: 'bold',
marginBottom: 20,
color: '#FFFFFF',
},
buttonText: {
fontSize: 18,
fontWeight: 'bold',
textAlign: 'center',
color: '#FFFFFF',
},
});

export default ProfileEditScreen;
