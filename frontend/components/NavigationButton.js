import React from 'react';
import { Pressable, Text } from 'react-native';

export const NavigationButton = ({ navigation, destination, text, highlightedText, style }) => {
  return (
    <>
    <Pressable
      onPress={() => navigation.navigate(destination)}
      style={({ pressed }) =>
        pressed
          ? [style.button, { backgroundColor: '#122E64' }]
          : style.button
      }
    >
      <Text style={style.buttonText}>
        {text} <Text style={style.highlightText}>{highlightedText}</Text>
      </Text>
    </Pressable>

    </>
  );
};


export const PressableButton = ({ navigation, destination, children, style }) => {
  return (
    <Pressable
      onPress={() => navigation.navigate(destination)}
      style={({ pressed }) =>
        pressed
          ? [style.button, { backgroundColor: '#122E64' }]
          : style.button
      }
    >
      {children}
    </Pressable>
  );
};