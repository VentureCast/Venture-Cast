/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * @generated by codegen project: GenerateModuleCpp.js
 */

#include "RNGoogleSignInCGenJSI.h"

namespace facebook::react {

static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_signIn(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->signIn(
    rt,
    count <= 0 ? throw jsi::JSError(rt, "Expected argument in position 0 to be passed") : args[0].asObject(rt)
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_configure(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->configure(
    rt,
    count <= 0 ? throw jsi::JSError(rt, "Expected argument in position 0 to be passed") : args[0].asObject(rt)
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_addScopes(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->addScopes(
    rt,
    count <= 0 ? throw jsi::JSError(rt, "Expected argument in position 0 to be passed") : args[0].asObject(rt)
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_playServicesAvailable(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->playServicesAvailable(
    rt,
    count <= 0 ? throw jsi::JSError(rt, "Expected argument in position 0 to be passed") : args[0].asBool()
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_signInSilently(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->signInSilently(
    rt
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_signOut(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->signOut(
    rt
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_revokeAccess(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->revokeAccess(
    rt
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_clearCachedAccessToken(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->clearCachedAccessToken(
    rt,
    count <= 0 ? throw jsi::JSError(rt, "Expected argument in position 0 to be passed") : args[0].asString(rt)
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_hasPreviousSignIn(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->hasPreviousSignIn(
    rt
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_getCurrentUser(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  auto result = static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->getCurrentUser(
    rt
  );
  return result ? jsi::Value(std::move(*result)) : jsi::Value::null();
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_getTokens(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->getTokens(
    rt
  );
}
static jsi::Value __hostFunction_NativeGoogleSigninCxxSpecJSI_getConstants(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {
  return static_cast<NativeGoogleSigninCxxSpecJSI *>(&turboModule)->getConstants(
    rt
  );
}

NativeGoogleSigninCxxSpecJSI::NativeGoogleSigninCxxSpecJSI(std::shared_ptr<CallInvoker> jsInvoker)
  : TurboModule("RNGoogleSignin", jsInvoker) {
  methodMap_["signIn"] = MethodMetadata {1, __hostFunction_NativeGoogleSigninCxxSpecJSI_signIn};
  methodMap_["configure"] = MethodMetadata {1, __hostFunction_NativeGoogleSigninCxxSpecJSI_configure};
  methodMap_["addScopes"] = MethodMetadata {1, __hostFunction_NativeGoogleSigninCxxSpecJSI_addScopes};
  methodMap_["playServicesAvailable"] = MethodMetadata {1, __hostFunction_NativeGoogleSigninCxxSpecJSI_playServicesAvailable};
  methodMap_["signInSilently"] = MethodMetadata {0, __hostFunction_NativeGoogleSigninCxxSpecJSI_signInSilently};
  methodMap_["signOut"] = MethodMetadata {0, __hostFunction_NativeGoogleSigninCxxSpecJSI_signOut};
  methodMap_["revokeAccess"] = MethodMetadata {0, __hostFunction_NativeGoogleSigninCxxSpecJSI_revokeAccess};
  methodMap_["clearCachedAccessToken"] = MethodMetadata {1, __hostFunction_NativeGoogleSigninCxxSpecJSI_clearCachedAccessToken};
  methodMap_["hasPreviousSignIn"] = MethodMetadata {0, __hostFunction_NativeGoogleSigninCxxSpecJSI_hasPreviousSignIn};
  methodMap_["getCurrentUser"] = MethodMetadata {0, __hostFunction_NativeGoogleSigninCxxSpecJSI_getCurrentUser};
  methodMap_["getTokens"] = MethodMetadata {0, __hostFunction_NativeGoogleSigninCxxSpecJSI_getTokens};
  methodMap_["getConstants"] = MethodMetadata {0, __hostFunction_NativeGoogleSigninCxxSpecJSI_getConstants};
}


} // namespace facebook::react