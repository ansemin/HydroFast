import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  common3: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  common4: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  common5: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  common6: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  common7: {
    alignItems: 'flex-end',
  },
  common8: {
    alignItems: 'center',
  },
  common1: {
    color: 'royalblue',
    fontWeight: '700',
  },
  common2: {
    color: 'dimgray',
    textAlign: 'left',
  },
  loginPage: {
    backgroundColor: 'white',
    rowGap: 5,
    flexDirection: 'column',
    paddingBottom: 39,
    paddingLeft: 25,
    paddingRight: 8,
    paddingTop: 83,
    width: '100%',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', // Make sure your font is available in RN
    lineHeight: 'normal',
    textAlign: 'center',
  },
  hydroprintText: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    paddingRight: 18,
  },
  textHydro: {
    color: 'royalblue',
    textAlign: 'center',
  },
  textPrint: {
    fontStyle: 'italic',
    color: 'midnightblue',
    textAlign: 'center',
  },
  vectorEmailContainer: {
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: 56,
  },
  vectorEmail: {
    columnGap: 67,
    textAlign: 'center',
  },
  vectorContainer: {
    paddingTop: 1,
  },
  vector: {
    width: 20,
    height: 16,
    textAlign: 'center',
  },
  lineContainer: {
    paddingLeft: 28,
    paddingRight: 28,
    paddingTop: 4,
  },
  line: {
    height: 2,
    textAlign: 'center',
    flex: 1,
  },
  vectorPasswordContainer: {
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: 23,
  },
  vectorPassword: {
    columnGap: 59,
    textAlign: 'center',
  },
  vector1: {
    width: 16,
    height: 21,
  },
  line1: {
    height: 2,
    flexShrink: 0, // Use `flexShrink` only if required
  },
  rectangleContainer: {
    paddingTop: 14,
  },
  rectangle: {
    paddingRight: 18,
    textAlign: 'center',
  },
  loginText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    backgroundColor: 'royalblue',
    paddingLeft: 30,
    paddingRight: 28,
    paddingTop: 2,
    paddingBottom: 6,
  },
  forgotPasswordContainer: {
    paddingLeft: 18,
    paddingRight: 18,
    paddingTop: 22,
  },
  forgotPasswordTextContainer: {
    paddingRight: 8,
    textAlign: 'center',
  },
  forgotPasswordText: {
    textAlign: 'center',
  },
  imageContainer: {
    paddingLeft: 17,
    paddingRight: 17,
    paddingTop: 17,
  },
  image: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    width: 244,
    height: 41,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  imageContainer1: {
    paddingLeft: 17,
    paddingRight: 17,
    paddingTop: 5,
  },
  image1: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    width: 244,
    height: 43,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  signUpContainer: {
    paddingRight: 8,
    paddingTop: 20,
    justifyContent: 'center',
  },
  signUpText: {
    textAlign: 'center',
  },
  signUpLinkText: {
    textAlign: 'center',
    color: 'royalblue',
    fontWeight: '700',
  },
});

















/* .common-3,
.login-page-tt-forgot-password-recover-here,
.login-page-tt-image {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.common-4,
.login-page-t-vector,
.login-page-t-don-thave-an-account-sign-up-here {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.common-5,
.login-page-tt-hydroprint,
.login-page-tt-vector-email,
.login-page-t-vector-password,
.login-page-t-forgot-password-recover-here {
  display: flex;
  justify-content: center;
  align-items: center;
}

.common-6,
.login-page-t-line,
.login-page-tt-rectangle,
.login-page-tt-image-1 {
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.common-7,
.login-page-ttt-vector-email,
.login-page-tt-vector-password {
  display: flex;
  align-items: flex-end;
}

.common-8,
.login-page-t-rectangle,
.login-page-t-image,
.login-page-t-image-1 {
  display: flex;
  align-items: center;
}

.common-1,
.login-page-text-2,
.login-page-text-3 {
  color: royalblue;
  font-weight: 700;
}

.common-2,
.login-page-email,
.login-page-password {
  color: dimgray;
  text-align: left;
}

.login-page-login-page {
  background-color: white;
  row-gap: 5px;
  flex-direction: column;
  padding-bottom: 39px;
  padding-left: 25px;
  padding-right: 8px;
  padding-top: 83px;
  display: flex;
  width: 100%;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  line-height: normal;
  text-align: center;
  letter-spacing: 0em;
}

.login-page-hydroprint {
  font-size: 30px;
  font-weight: 700;
  text-align: center;
  padding-right: 18px;
}

.login-page-text {
  color: royalblue;
  text-align: center;
}

.login-page-text-1 {
  font-style: italic;
  color: midnightblue;
  text-align: center;
}

.login-page-ttt-vector-email {
  padding-left: 32px;
  padding-right: 32px;
  padding-top: 56px;
}

.login-page-tt-vector-email {
  column-gap: 67px;
  text-align: center;
}

.login-page-t-vector {
  padding-top: 1px;
}

.login-page-vector {
  width: 20px;
  height: 16px;
  text-align: center;
  flex-shrink: 0;
}

.login-page-t-line {
  padding-left: 28px;
  padding-right: 28px;
  padding-top: 4px;
}

.login-page-line {
  flex-grow: 1;
  height: 2px;
  text-align: center;
}

.login-page-tt-vector-password {
  padding-left: 32px;
  padding-right: 32px;
  padding-top: 23px;
}

.login-page-t-vector-password {
  column-gap: 59px;
  text-align: center;
}

.login-page-vector-1 {
  width: 16px;
  height: 21px;
  flex-shrink: 0;
}

.login-page-line-1 {
  height: 2px;
  flex-shrink: 0;
}

.login-page-tt-rectangle {
  padding-top: 14px;
}

.login-page-t-rectangle {
  padding-right: 18px;
  text-align: center;
}

.login-page-login {
  font-size: 24px;
  font-weight: 700;
  color: white;
  background-color: royalblue;
  padding-left: 30px;
  padding-right: 28px;
  padding-top: 2px;
  padding-bottom: 6.2px;
}

.login-page-tt-forgot-password-recover-here {
  padding-left: 18px;
  padding-right: 18px;
  padding-top: 22px;
}

.login-page-t-forgot-password-recover-here {
  padding-right: 8px;
  text-align: center;
}

.login-page-para-1 {
  text-align: center;
}

.login-page-tt-image {
  padding-left: 17px;
  padding-right: 17px;
  padding-top: 17px;
}

.login-page-t-image {
  text-align: center;
}

.login-page-image {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  background-image: url(/assets/image.png);
  background-size: 102% 100%;
  background-position: -3px 0px;
  background-repeat: no-repeat;
  max-width: 100%;
  max-height: 100%;
  width: 244px;
  height: 41px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  flex-shrink: 0;
}

.login-page-tt-image-1 {
  padding-left: 17px;
  padding-right: 17px;
  padding-top: 5px;
}

.login-page-t-image-1 {
  flex-grow: 1;
  text-align: center;
}

.login-page-image-1 {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  background-image: url(/assets/image-1.png);
  background-size: 103% 100%;
  background-position: -4px 0px;
  background-repeat: no-repeat;
  max-width: 100%;
  max-height: 100%;
  width: 244px;
  height: 43px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  flex-shrink: 0;
}

.login-page-t-don-thave-an-account-sign-up-here {
  padding-right: 8px;
  padding-top: 20px;
  justify-content: center;
}

.login-page-don-thave-an-account-sign-up-here {
  text-align: center;
}

.login-page-text-3 {
  text-align: center;
} */
