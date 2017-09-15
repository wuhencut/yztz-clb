/**
 * Created by JIAQIANG on 2015/11/5.
 */
'use strict';
//noinspection JSUnresolvedFunction
var myApp = angular.module('myApp', ['ngRoute', 'ngCookies', 'ngAnimate', 'ngTouch', 'myControllers', 'myServices', 'myDirectives']);

myApp.constant('ST', {
    v: '?v=' + (new Date().getTime())
});

myApp.config(function ($httpProvider, $routeProvider, ST) {
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    $httpProvider.interceptors.push('myInterceptor');
    $routeProvider.when('/index', {
        templateUrl: 'partials/index.html' + ST.v,
        controller: 'IndexCtrl',
        access: true
    }).when('/login', {
        templateUrl: 'partials/login.html' + ST.v,
        controller: 'LoginCtrl',
        access: true
    }).when('/register1', {
        templateUrl: 'partials/register1.html' + ST.v,
        controller: 'Register1Ctrl',
        access: true
    }).when('/register2/:mobile', {
        templateUrl: 'partials/register2.html' + ST.v,
        controller: 'Register2Ctrl',
        access: true
    }).when('/agreementRegister', {
        templateUrl: 'partials/agreementRegister.html' + ST.v,
        controller: 'AgreementRegister',
        access: true
    }).when('/myHome', {
        templateUrl: 'partials/myHome.html' + ST.v,
        controller: 'MyHomeCtrl',
        access: false
    }).when('/myInfo', {
        templateUrl: 'partials/myInfo.html' + ST.v,
        controller: 'MyInfoCtrl',
        access: false
    }).when('/forgetUserPass', {
        templateUrl: 'partials/forgetUserPass.html' + ST.v,
        controller: 'ForgetUserPassCtrl',
        access: true
    }).when('/forgetTradePass', {
        templateUrl: 'partials/forgetTradePass.html' + ST.v,
        controller: 'ResetTradePassCtrl',
        access: false
    }).when('/userPassModify', {
        templateUrl: 'partials/userPassModify.html' + ST.v,
        controller: 'UserPassModifyCtrl',
        access: false
    }).when('/identification', {
        templateUrl: 'partials/identification.html' + ST.v,
        controller: 'IdentificationCtrl',
        access: false
    }).when('/tradePassSet', {
        templateUrl: 'partials/tradePassSet.html' + ST.v,
        controller: 'TradePassSetCtrl',
        access: false
    }).when('/tradePassModify', {
        templateUrl: 'partials/tradePassModify.html' + ST.v,
        controller: 'TradePassModifyCtrl',
        access: false
    }).when('/payType', {
        templateUrl: 'partials/payType.html' + ST.v,
        controller: 'PayTypeCtrl',
        access: false
    }).when('/payBank', {
        templateUrl: 'partials/payBank.html' + ST.v,
        controller: 'PayBankCtrl',
        access: false
    }).when('/payMobile', {
        templateUrl: 'partials/payMobile.html' + ST.v,
        controller: 'PayMobileCtrl',
        access: false
    }).when('/paySuccess', {
        templateUrl: 'partials/paySuccess.html' + ST.v,
        controller: 'PaySuccessCtrl',
        access: false
    }).when('/bankInfo', {
        templateUrl: 'partials/bankInfo.html' + ST.v,
        controller: 'BankInfoCtrl',
        access: false
    }).when('/bankCardList', {
        templateUrl: 'partials/bankCardList.html' + ST.v,
        controller: 'BankCardListCtrl',
        access: false
    }).when('/addBankCard', {
        templateUrl: 'partials/addBankCard.html' + ST.v,
        controller: 'AddBankCardCtrl',
        access: false
    }).when('/modifyBankCard/:bankCardId', {
        templateUrl: 'partials/modifyBankCard.html' + ST.v,
        controller: 'ModifyBankCardCtrl',
        access: false
    }).when('/withdraw', {
        templateUrl: 'partials/withdraw.html' + ST.v,
        controller: 'WithdrawCtrl',
        access: false
    }).when('/fund', {
        templateUrl: 'partials/fund.html' + ST.v,
        controller: 'FundCtrl',
        access: false
    }).when('/notice', {
        templateUrl: 'partials/notice.html' + ST.v,
        controller: 'NoticeCtrl',
        access: false
    }).when('/noticeDetail/:noticeId', {
        templateUrl: 'partials/noticeDetail.html' + ST.v,
        controller: 'NoticeDetailCtrl',
        access: false
    }).when('/help', {
        templateUrl: 'partials/help.html' + ST.v,
        controller: 'HelpCtrl',
        access: true
    }).when('/helpDetail/:helpDetailId', {
        templateUrl: 'partials/helpDetail.html' + ST.v,
        controller: 'HelpDetailCtrl',
        access: true
    }).when('/helpCenter', {
        templateUrl: 'partials/helpCenter.html' + ST.v,
        controller: 'HelpCenterCtrl',
        access: false
    }).when('/helpAsk', {
        templateUrl: 'partials/helpAsk.html' + ST.v,
        controller: 'HelpAskCtrl',
        access: false
    }).when('/guide', {
        templateUrl: 'partials/guide.html' + ST.v,
        controller: 'GuideCtrl',
        access: true
    }).when('/safe', {
        templateUrl: 'partials/safe.html' + ST.v,
        controller: 'SafeCtrl',
        access: true
    }).when('/aboutUs', {
        templateUrl: 'partials/aboutUs.html' + ST.v,
        controller: 'AboutUsCtrl',
        access: true
    }).when('/introduce', {
        templateUrl: 'partials/introduce.html' + ST.v,
        controller: 'IntroduceCtrl',
        access: true
    }).when('/outerTrade/:commodityNo/:type', {
        templateUrl: 'partials/outerTrade.html' + ST.v,
        controller: 'OuterTradeCtrl',
        access: true
    }).when('/outerTradeBuy/:commodityNo/:type/:buyChange', {
        templateUrl: 'partials/outerTradeBuy.html' + ST.v,
        controller: 'OuterTradeBuyCtrl',
        access: false
    }).when('/outerTradeSell/:commodityNo/:type', {
        templateUrl: 'partials/outerTradeSell.html' + ST.v,
        controller: 'OuterTradeSellCtrl',
        access: false
    }).when('/outerTradeResult/:commodityNo/:type', {
        templateUrl: 'partials/outerTradeResult.html' + ST.v,
        controller: 'OuterTradeResultCtrl',
        access: false
    }).when('/outerAgreementSigned/:commodityNo', {
        templateUrl: 'partials/outerAgreementSigned.html' + ST.v,
        controller: 'OuterAgreementSignedCtrl',
        access: false
    }).when('/agreementCL', {
        templateUrl: 'partials/agreementCL.html' + ST.v,
        controller: 'OuterAgreementCtrl',
        access: true
    }).when('/agreementGC', {
        templateUrl: 'partials/agreementGC.html' + ST.v,
        controller: 'OuterAgreementCtrl',
        access: true
    }).when('/agreementHSI', {
        templateUrl: 'partials/agreementHSI.html' + ST.v,
        controller: 'OuterAgreementCtrl',
        access: true
    }).when('/agreementMHI', {
        templateUrl: 'partials/agreementMHI.html' + ST.v,
        controller: 'OuterAgreementCtrl',
        access: true
    }).when('/agreementSI', {
        templateUrl: 'partials/agreementSI.html' + ST.v,
        controller: 'OuterAgreementCtrl',
        access: true
    }).when('/agreementDAX', {
        templateUrl: 'partials/agreementDAX.html' + ST.v,
        controller: 'OuterAgreementCtrl',
        access: true
    }).when('/agreementCN', {
        templateUrl: 'partials/agreementCN.html' + ST.v,
        controller: 'OuterAgreementCtrl',
        access: true
    }).when('/agreementSaletorCL', {
        templateUrl: 'partials/agreementSaletorCL.html' + ST.v,
        controller: 'OuterAgreementSaletorCtrl',
        access: true
    }).when('/agreementSaletorGC', {
        templateUrl: 'partials/agreementSaletorGC.html' + ST.v,
        controller: 'OuterAgreementSaletorCtrl',
        access: true
    }).when('/agreementSaletorHSI', {
        templateUrl: 'partials/agreementSaletorHSI.html' + ST.v,
        controller: 'OuterAgreementSaletorCtrl',
        access: true
    }).when('/agreementSaletorMHI', {
        templateUrl: 'partials/agreementSaletorMHI.html' + ST.v,
        controller: 'OuterAgreementSaletorCtrl',
        access: true
    }).when('/agreementSaletorSI', {
        templateUrl: 'partials/agreementSaletorSI.html' + ST.v,
        controller: 'OuterAgreementSaletorCtrl',
        access: true
    }).when('/agreementSaletorDAX', {
        templateUrl: 'partials/agreementSaletorDAX.html' + ST.v,
        controller: 'OuterAgreementSaletorCtrl',
        access: true
    }).when('/agreementSaletorCN', {
        templateUrl: 'partials/agreementSaletorCN.html' + ST.v,
        controller: 'OuterAgreementSaletorCtrl',
        access: true
    }).when('/tradeRuleCL', {
        templateUrl: 'partials/tradeRuleCL.html' + ST.v,
        controller: 'OuterTradeRuleCtrl',
        access: true
    }).when('/tradeRuleGC', {
        templateUrl: 'partials/tradeRuleGC.html' + ST.v,
        controller: 'OuterTradeRuleCtrl',
        access: true
    }).when('/tradeRuleHSI', {
        templateUrl: 'partials/tradeRuleHSI.html' + ST.v,
        controller: 'OuterTradeRuleCtrl',
        access: true
    }).when('/tradeRuleMHI', {
        templateUrl: 'partials/tradeRuleMHI.html' + ST.v,
        controller: 'OuterTradeRuleCtrl',
        access: true
    }).when('/tradeRuleSI', {
        templateUrl: 'partials/tradeRuleSI.html' + ST.v,
        controller: 'OuterTradeRuleCtrl',
        access: true
    }).when('/tradeRuleDAX', {
        templateUrl: 'partials/tradeRuleDAX.html' + ST.v,
        controller: 'OuterTradeRuleCtrl',
        access: true
    }).when('/tradeRuleCN', {
        templateUrl: 'partials/tradeRuleCN.html' + ST.v,
        controller: 'OuterTradeRuleCtrl',
        access: true
    }).when('/settleNoInfo', {
        templateUrl: 'partials/settleNoInfo.html' + ST.v,
        access: true
    }).when('/alipay', {
        templateUrl: 'partials/alipay.html' + ST.v,
        controller: 'AlipayCtrl',
        access: false
    }).when('/alipayDetail', {
        templateUrl: 'partials/alipayDetail.html' + ST.v,
        controller: 'AlipayDetailCtrl',
        access: false
    }).when('/aliPayIdentification', {
        templateUrl: 'partials/aliPayIdentification.html' + ST.v,
        controller: 'AliPayIdentificationCtrl',
        access: false
    }).when('/dev', {
        templateUrl: 'partials/dev.html' + ST.v,
        controller: 'DevCtrl',
        access: true
    }).when('/article-20160831', {
        templateUrl: 'partials/article-20160831.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/article-20161021', {
        templateUrl: 'partials/article-20161021.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/article-20161130', {
        templateUrl: 'partials/article-20161130.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/article-20161230', {
        templateUrl: 'partials/article-20161230.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/article-20170109', {
        templateUrl: 'partials/article-20170109.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/article-20170116', {
        templateUrl: 'partials/article-20170116.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/article-20170309', {
        templateUrl: 'partials/article-20170309.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/actPacket', {
        templateUrl: 'partials/actPacket.html' + ST.v,
        controller: 'ActPacketCtrl',
        access: true
    }).when('/myPacket', {
        templateUrl: 'partials/myPacket.html' + ST.v,
        controller: 'MyPacketCtrl',
        access: false
    }).when('/extension', {
        templateUrl: 'partials/extension.html' + ST.v,
        controller: 'ExtensionCtrl',
        access: true
    }).when('/attentionWechat', {
        templateUrl: 'partials/attentionWechat.html' + ST.v,
        controller: 'AttentionCtrl',
        access: false
    }).when('/phoneBind1', {
        templateUrl: 'partials/phoneBind1.html' + ST.v,
        controller: 'PhoneBind1Ctrl',
        access: false
    }).when('/phoneBind2', {
        templateUrl: 'partials/phoneBind2.html' + ST.v,
        controller: 'PhoneBind2Ctrl',
        access: false
    }).when('/oneYuanIntroduce', {
        templateUrl: 'partials/oneYuanIntroduce.html' + ST.v,
        controller: 'OneYuanIntroduceCtrl',
        access: true
    }).when('/discover', {
        templateUrl: 'partials/discover.html' + ST.v,
        controller: 'DiscoverCtrl',
        access: true
    }).when('/oneYuanTrade', {
        templateUrl: 'partials/oneYuanTrade.html' + ST.v,
        controller:'OneYuanTradeCtrl',
        access: true
    }).when('/oneYuanTradeBuy/:buyChange', {
        templateUrl: 'partials/oneYuanTradeBuy.html' + ST.v,
        controller: 'OneYuanTradeBuyCtrl',
        access: false
    }).when('/oneYuanTradeSell', {
        templateUrl: 'partials/oneYuanTradeSell.html' + ST.v,
        controller:'OneYuanTradeSellCtrl',
        access: false
    }).when('/oneYuanTradeResult', {
        templateUrl: 'partials/oneYuanTradeResult.html' + ST.v,
        controller:'OneYuanTradeResultCtrl',
        access: false
    }).when('/news', {
        templateUrl: 'partials/news.html' + ST.v,
        controller: 'NewsCtrl',
        access: true
    }).when('/dayGainList', {
        templateUrl: 'partials/dayGainList.html' + ST.v,
        controller: 'DayGainListCtrl',
        access: true
    }).when('/activityCenter', {
        templateUrl: 'partials/activityCenter.html' + ST.v,
        controller: 'ActivityCenterCtrl',
        access: true
    }).when('/getSimCoin', {
        templateUrl: 'partials/getSimCoin.html' + ST.v,
        controller: 'GetSimCoinCtrl',
        access: false
    }).otherwise({
        redirectTo: '/index'
    });
}).run(function ($rootScope, $location, AuthService) {
    $rootScope.$on('$routeChangeStart', function (evt, next) {
        // X.loading.hide();
        // X.dialog.close();
        var backURL = next.originalPath, key;
        if (next.originalPath && !next.access) {
            for (key in next.params) {
                //noinspection JSUnfilteredForInLoop
                backURL = backURL.replace(':' + key, next.params[key]);
            }
            X.log('-----路由拦截 URL:' + backURL + '-----');
            if (!AuthService.auth()) {
                X.log('-----用户未登录，跳转到登录-----');
                evt.preventDefault();
                $location.path('/login').search({'goURL': backURL});
            } else {
                X.log('-----用户已登录，放行-----');
            }
        } else {
            X.log('-----路由放行 URL:' + next.originalPath + '-----');
        }
    });
});