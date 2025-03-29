import React from 'react';
import Svg, { Line as SvgLine } from 'react-native-svg';

const Line = (props) => (
  <Svg height="100%" width="100%" viewBox="0 0 100 10" {...props}>
    <SvgLine x1="0" y1="5" x2="100" y2="5" stroke="black" strokeWidth="2" />
  </Svg>
);

export default Line;
