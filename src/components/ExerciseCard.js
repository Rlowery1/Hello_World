import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput,  TouchableOpacity, Linking } from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { Auth } from 'aws-amplify';
import { createExerciseLog } from '../graphql/mutations';
import { getLatestExerciseLog } from '../graphql/queries';
import { LinearGradient } from 'expo-linear-gradient';


const ExerciseCardWrapper = ({ exercise, navigation, workoutSessionId }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [lastSetInput, setLastSetInput] = useState('');
  const [lastWeightInput, setLastWeightInput] = useState('');

  const toggleLogging = () => {
    setIsLogging(!isLogging);
    if (!isLogging) {
      fetchLatestLoggedExerciseData(exercise.name);
    }
  };

  useEffect(() => {
    if (isLogging) {
      fetchLatestLoggedExerciseData(exercise.name)
    }
  }, [isLogging]);

  const fetchLatestLoggedExerciseData = async (exercise) => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      const userId = currentUser.attributes.sub;
      const exerciseName = exercise.name;

      const exerciseLogData = await API.graphql(
        graphqlOperation(getLatestExerciseLog, {
          exerciseName: exerciseName,
          userId: userId,
        })
      );

      if (exerciseLogData.data.getLatestExerciseLog) {
        const latestLog = exerciseLogData.data.getLatestExerciseLog;
        setLastSetInput(latestLog.reps[latestLog.reps.length - 1]);
        setLastWeightInput(latestLog.weights[latestLog.weights.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching latest logged exercise data:', error);
    }
  };

  return (
    <>
      {isLogging ? (
        <LoggedExerciseCard
          exercise={exercise}
          onStopLogging={toggleLogging}
          workoutSessionId={workoutSessionId}
          lastSetInput={lastSetInput}
          lastWeightInput={lastWeightInput}
          setLastSetInput={setLastSetInput}
          setLastWeightInput={setLastWeightInput}
        />
      ) : (
        <ExerciseCard exercise={exercise} onStartLogging={toggleLogging} navigation={navigation} videoId={exercise.videoId} />

      )}
    </>
  );
};

const ExerciseCard = ({ exercise, onStartLogging, navigation, videoId }) => {
  const handleCardPress = () => {
    navigation.navigate('ExerciseDetails', { exercise });
  };

  const openYoutubeVideo = () => {
    if (exercise.videoId) {
      Linking.openURL(`https://www.youtube.com/watch?v=${exercise.videoId}`);
    }
  };
  return (
    <TouchableOpacity activeOpacity={1} onPress={handleCardPress}>
      <LinearGradient
        colors={['#303030', '#303030']} // Change the background color
        start={[0, 0]}
        end={[1, 0]}
        style={styles.card}
      >
        <Image style={styles.gif} source={{ uri: exercise.gifUrl }} />
        <View style={styles.cardContent}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.info}>
            Equipment: {exercise.equipment}{'\n'}
            Target: {exercise.target}{'\n'}
            Body Part: {exercise.bodyPart}{'\n'}
            Sets: {exercise.sets}{'\n'}
            Reps: {exercise.reps.join('/')}
          </Text>
          {exercise.videoId && (
            <TouchableOpacity onPress={openYoutubeVideo} style={styles.videoLink}>
              <Text style={styles.videoLinkText}>Watch on YouTube</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onStartLogging} style={styles.logButton} activeOpacity={0.8}>
            <Text style={styles.logButtonText}>Log Exercise</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};



const LoggedExerciseCard = ({
  exercise,
  onStopLogging,
  lastSetInput,
  lastWeightInput,
  setLastSetInput,
  setLastWeightInput,
  videoId,
}) => {
  const [sets, setSets] = useState(Array(exercise.sets).fill(''));
  const [weights, setWeights] = useState(Array(exercise.sets).fill(''));


  const updateSets = (index, value) => {
    const newSets = [...sets];
    newSets[index] = value;
    setSets(newSets);
    setLastSetInput(value);
  };

  const updateWeights = (index, value) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
    setLastWeightInput(value);
  };



  const saveLoggedExercise = async () => {
    try {
      const setsData = sets.map((set, index) => parseInt(set, 10));
      const weightsData = weights.map((weight) => parseFloat(weight));

      const currentUser = await Auth.currentAuthenticatedUser();
      const userId = currentUser.attributes.sub;

      const exerciseData = {
        exerciseName: exercise.name,
        date: new Date().toISOString(),
        reps: setsData,
        weights: weightsData,
        userId: userId,
      };

      console.log('exerciseData:', exerciseData);

      await API.graphql(graphqlOperation(createExerciseLog, { input: exerciseData }));
    } catch (error) {
      console.error('Error saving logged exercise:', error);
    }
  };









  return (
    <>
      <Text style={styles.name}>{exercise.name}</Text>
      {exercise.videoId && (
        <TouchableOpacity onPress={openYoutubeVideo} style={styles.videoLink}>
          <Text style={styles.videoLinkText}>Watch on YouTube</Text>
        </TouchableOpacity>
      )}
      {sets.map((_, index) => (
          <View key={`${exercise.name}-${index}`} style={styles.inputRow}>
          <Text style={styles.setInputLabel}>Set {index + 1}</Text>
          <TextInput
            style={styles.setInput}
            keyboardType="numeric"
            onChangeText={(value) => updateSets(index, value)}
            value={sets[index]}
            placeholder={lastSetInput || "Reps"}
          />
          <TextInput
            style={styles.setInput}
            keyboardType="numeric"
            onChangeText={(value) => updateWeights(index, value)}
            value={weights[index]}
            placeholder={lastWeightInput || "Weight"}
          />
        </View>
      ))}
      <TouchableOpacity
        onPress={async () => {
          await saveLoggedExercise();
          onStopLogging();
        }}
        style={styles.stopLoggingButton}
      >
        <Text style={styles.logButtonText}>Stop Logging</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  cardContent: {
    backgroundColor: '#303030',
    borderRadius: 10,
    padding: 20,
    marginTop: -25,
    width: '100%',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  gif: {
    width: '100%',
    height: 250, // Change height to make the urlGIFs look larger
    resizeMode: 'cover',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  logButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  logButtonText: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: '500',
  },
  videoLink: {
    backgroundColor: '#FF0000',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  videoLinkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ExerciseCardWrapper;

