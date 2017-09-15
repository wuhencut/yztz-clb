/**
 * Created by JIAQIANG on 2015/11/5.
 */
'use strict';
//noinspection JSUnresolvedFunction
var myControllers = angular.module('myControllers', []);
//首页 DONE
myControllers.controller('IndexCtrl', function ($scope, $location, $swipe, StockService, ADBannerService) {
	X.loading.show();
	var commodityNo = ['CL', 'GC', 'HSI', 'SI', 'DAX', 'CN', 'MHI'];
	var isFirstFuturesQuote = true, isLoadFuturesQuote = true;

	$scope.stock = {};
	$scope.future = {};

	function getFuturesQuote() {
		//判断是否在行情时段
		if (isFirstFuturesQuote || (true && isLoadFuturesQuote)) {
			isFirstFuturesQuote = false;
			isLoadFuturesQuote = false;
			StockService.getFuturesSimpleQuote(commodityNo.join(',')).then(function (res) {
				isLoadFuturesQuote = true;
				var data = res.data;
				if (data.code == 100) {
					processFuturesQuote(data.data);
				} else {
					//X.tip(data['resultMsg']);
				}
				X.loading.hide();
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}
	}

	var banners = [];
	$scope.AD = {};
	$scope.showADDialog = false;

	function getADBanner() {
		X.loading.show();
		ADBannerService.getADBannerData().then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				initADBannerData(data.data);
				showAD($scope.AD.id);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}


	function initADBannerData(data) {
		var arr = [];
		for (var i in data) {
			data[i] = arr[i] = {
				id: data[i][0],
				title: data[i][1],
				type: data[i][2],
				imgURL: data[i][3],
				link: data[i][5] || '',
				btnName: data[i][6] || '',
				btnLink: data[i][8] || ''
			};
			if (data[i].type == 0) {
				$scope.AD = data[i];
			} else {
				banners.push(data[i]);
			}
		}
		X.slide.init('mod-slide', banners, $swipe);
	}

	function showAD(id) {
		if ($scope.AD.imgURL && $scope.AD.id) {
			var storage = window.localStorage, ADID = 'ADID', ADIDStr = storage.getItem(ADID) || '';
			if (ADIDStr == '' || ADIDStr != id) {
				storage.setItem(ADID, id);
				$scope.showADDialog = true;
			}
		}
	}

	//url跳转
	$scope.urlJump = function (obj) {
		if (!obj.link)return;
		var link = obj.link;
		if (obj.btnName) {
			var btnName = encodeURIComponent(obj.btnName), btnLink = encodeURIComponent(obj.btnLink);
			link = link + '?btnName=' + btnName + '&btnLink=' + btnLink;
		}
		window.location.href = link;
	};


	function processFuturesQuote(data) {
		if (!data) {
			return;
		}
		var i, datas = data.split(';'), len = datas.length, tempArr;
		if (commodityNo.length != len) {
			return;
		}
		for (i = 0; i < len; i++) {
			tempArr = datas[i].split(',');
			//时间,涨跌幅,最新价
			$scope.future[commodityNo[i]] = {
				price: tempArr[2],
				rote: tempArr[1]
			};
		}
	}

	getFuturesQuote();
	getADBanner();
	X.engine.addTask(getFuturesQuote, 1000);

	X.engine.start();

	$scope.$on('$destroy', function () {
		X.engine.destroy();
	});
});
//登录 DONE
myControllers.controller('LoginCtrl', function ($rootScope, $scope, $location, LoginService, AuthService) {
	$scope.goURL = $location.search().goURL || '/myHome';

	$scope.form = {
		username: '',
		password: ''
	};

	$scope.login = function () {
		if ($scope.form.username == '') {
			X.tip('请输入您的账号');
			return false;
		}
		if ($scope.form.password == '') {
			X.tip('请输入登录密码');
			return false;
		}

		X.loading.show();
		LoginService.login($scope.form.username, $scope.form.password).then(function (res) {
			var data = res.data;
			if (data['authenticated']) {
				$rootScope.isLogin = true;
				if ($scope.backURL == '/login') {
					$scope.backURL = '/myHome';
				}
				AuthService.signIn(data['userId']);
				$location.url($scope.goURL);
				//埋点：个人信息
				zhuge.identify(data['userId']);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};
});
//注册第一步 DONE
myControllers.controller('Register1Ctrl', function ($scope, $compile, $location, RegisterService) {
	var timer = null;
	$scope.mobile = '';
	$scope.time = 0;
	$scope.temptimes = Date.now();
	$scope.agreement = true;
	$scope.checkCode = '';//验证码
	$scope.imgCode = '';
	$scope.showCodeDialog = false;

	//下一步
	$scope.register = function () {
		if ($scope.mobile == '') {
			X.tip('请输入手机号码');
			return false;
		}
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码输入错误');
			return false;
		}
		if ($scope.checkCode == '') {
			X.tip('请输入短信验证码');
			return false;
		}
		if (!/^\d{4}$/.test($scope.checkCode)) {
			X.tip('验证码输入错误');
			$scope.refreshCode();
			return false;
		}
		if (!$scope.agreement) {
			X.tip('请阅读并同意网站服务协议');
			return false;
		}

		//验证手机号码是否已经注册
		X.loading.show();
		RegisterService.regNextStep($scope.mobile, $scope.checkCode).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$location.path('/register2/' + data.data);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
		//埋点：开始注册
		zhuge.track('注册-开始注册');
	};

	//显示图片验证码
	$scope.getImgCode = function () {
		if ($scope.mobile == '') {
			X.tip('请输入手机号码');
			return false;
		}
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码输入错误');
			return false;
		}
		$scope.refreshCode();
		$scope.showCodeDialog = true;
	};

	//获取验证吗
	$scope.sendCode = function () {
		if ($scope.mobile == '') {
			X.tip('请输入手机号码');
			return false;
		}
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码输入错误');
			return false;
		}
		if ($scope.imgCode == '') {
			X.tip('请输入图片验证码');
			return false;
		}
		if (!/^\d{4}$/.test($scope.imgCode)) {
			X.tip('图片验证码输入错误');
			$scope.refreshCode();
			return false;
		}
		//发送验证码请求
		X.loading.show();
		RegisterService.getRegisterCode($scope.mobile, $scope.imgCode).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$scope.closeDialog();
				X.tip('验证码已发送至手机，请注意查收');
				$scope.time = 60;
				timerFn();
			} else if (data.code == 101) {
				$scope.closeDialog();
				X.tip('验证码已发送至手机，请注意查收');
				$scope.time = data.data.interval;
				timerFn();
			} else {
				X.tip(data['resultMsg']);
				$scope.refreshCode();
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	// 关闭弹出框
	$scope.closeDialog = function () {
		$scope.showCodeDialog = false;
		$scope.imgCode = '';
	};

	//刷新验证码
	$scope.refreshCode = function () {
		$scope.temptimes = Date.now();
	};

	//倒计时方法
	function timerFn() {
		timer = setInterval(function () {
			if ($scope.time > 0) {
				$scope.$apply(function () {
					$scope.time--;
				});
			} else {
				timer && clearTimeout(timer);
			}
		}, 1000);
	}

	//清空定时器
	function clearTimer() {
		$scope.time = 0;
		timer && clearTimeout(timer);
		timer = null;
	}

	//卸载页面的定时器
	$scope.$on('$destroy', function () {
		clearTimer();
	});
});
//注册第二步 DONE
myControllers.controller('Register2Ctrl', function ($scope, $location, $routeParams, RegisterService, AuthService) {

	$scope.mobile = $routeParams['mobile'] || '';
	if ($scope.mobile == '') {
		$location.url('/register1');
	}

	$scope.username = '';//昵称
	$scope.password = '';//登录密码
	$scope.surepass = '';//

	//注册
	$scope.register = function () {
		if ($scope.username == '') {
			X.tip('用户名不能为空');
			return false;
		}
		if (X.strLen($scope.username) < 4 || X.strLen($scope.username) > 16) {
			X.tip('用户名为4-16个字符，中文算2个字符');
			return false;
		}
		if (!/^[0-9a-zA-Z_\u4e00-\u9fa5]+$/.test($scope.username)) {
			X.tip('用户名只允许字母、数字、下划线或中文');
			return false;
		}
		if (!/^\w{6,16}$/.test($scope.password) || /^\d+$/.test($scope.password) || /^([a-zA-Z]+)$/.test($scope.password)) {
			X.tip('登录密码为6-16位数字和字母组成');
			return false;
		}
		if ($scope.password != $scope.surepass) {
			X.tip('确认密码与密码不一致');
			return false;
		}
		X.loading.show();
		RegisterService.doRegister($scope.mobile, $scope.username, $scope.password).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('注册成功');
				$location.path('/index');
				//默认用户是在登录页面进入，如果是直接输入URL进入注册，此处将会有问题
				//history.go(-2);

				//    埋点：注册-完成注册
				zhuge.track('注册-完成注册');
				AuthService.signIn(data.data);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};
});
//忘记登陆密码 DONE
myControllers.controller('ForgetUserPassCtrl', function ($scope, $location, PasswordService) {
	var timer = null;//定时器
	$scope.backURL = $location.search()['backURL'] || '/login';
	$scope.time = 0;
	$scope.mobile = '';//手机号
	$scope.checkCode = '';//验证码
	$scope.newPass = '';//新登录密码
	$scope.confirmPass = '';//确认新的登录密码
	$scope.imgCode = '';
	$scope.showCodeDialog = false;
	$scope.temptimes = Date.now();

	//忘记密码
	$scope.forgetUserPass = function () {
		if ($scope.mobile == '') {
			X.tip('请输入手机号码');
			return false;
		}
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码错误');
			return false;
		}
		if (!/^\d{6}$/.test($scope.checkCode)) {
			X.tip('验证码输入错误');
			return false;
		}
		if ($scope.newPass == '') {
			X.tip('请输入新登录密码');
			return false;
		}
		if (!/^\w{6,16}$/.test($scope.newPass) || /^\d+$/.test($scope.newPass) || /^([a-zA-Z]+)$/.test($scope.newPass)) {
			X.tip('登录密码为6-16位数字和字母组成');
			return false;
		}
		if ($scope.confirmPass == '') {
			X.tip('请输入确认密码');
			return false;
		}
		if ($scope.confirmPass != $scope.newPass) {
			X.tip('两次密码输入不一致');
			return false;
		}

		X.loading.show();
		PasswordService.resetForgetPassword($scope.mobile, $scope.checkCode, $scope.newPass).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('密码重置成功，请重新登录');
				//如果注册成功默认登录，跳转到登录页面
				$location.path('/login');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//显示图片验证码
	$scope.getImgCode = function () {
		if ($scope.mobile == '') {
			X.tip('请输入手机号码');
			return false;
		}
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码输入错误');
			return false;
		}
		$scope.refreshCode();
		$scope.showCodeDialog = true;
	};

	// 关闭弹出框
	$scope.closeDialog = function () {
		$scope.showCodeDialog = false;
		$scope.imgCode = '';
	};

	//刷新验证码
	$scope.refreshCode = function () {
		$scope.temptimes = Date.now();
	};

	//获取验证码
	$scope.sendCode = function () {
		if ($scope.mobile == '') {
			X.tip('请输入手机号码');
			return false;
		}
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码输入错误');
			return false;
		}
		if ($scope.imgCode == '') {
			X.tip('请输入图片验证码');
			return false;
		}
		if (!/^\d{4}$/.test($scope.imgCode)) {
			X.tip('图片验证码输入错误');
			$scope.refreshCode();
			return false;
		}
		//发送验证码请求
		X.loading.show();
		PasswordService.sendForgetCode($scope.mobile, $scope.imgCode).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$scope.closeDialog();
				X.tip('验证码已发送至手机，请注意查收');
				$scope.time = 60;
				timerFn();
			} else if (data.code == 101) {
				$scope.closeDialog();
				X.tip('验证码已发送至手机，请注意查收');
				$scope.time = data.data.interval;
				timerFn();
			} else {
				X.tip(data['resultMsg']);
				$scope.refreshCode();
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//倒计时方法
	function timerFn() {
		timer = setInterval(function () {
			if ($scope.time > 0) {
				$scope.$apply(function () {
					$scope.time--;
				});
			} else {
				timer && clearTimeout(timer);
			}
		}, 1000);
	}

	//清空定时器
	function clearTimer() {
		$scope.time = 0;
		timer && clearTimeout(timer);
		timer = null;
	}

	//卸载页面的定时器
	$scope.$on('$destroy', function () {
		clearTimer();
	});
});
//实名认证 DONE
myControllers.controller('IdentificationCtrl', function ($scope, $location, UserService) {
	$scope.backURL = $location.search()['backURL'] || '/myInfo';
	$scope.name = '';
	$scope.IDNum = '';

	$scope.certification = function () {
		if ($scope.name == '') {
			X.tip('请输入您的姓名');
			return false;
		}

		if (!X.isChinaName($scope.name)) {
			X.tip('请输入正确的姓名');
			return false;
		}

		if ($scope.IDNum == '') {
			X.tip('请输入身份证号码');
			return false;
		}

		if (!X.isIdentityNumber($scope.IDNum)) {
			X.tip('身份证号码错误');
			return false;
		}

		X.loading.show();
		UserService.realName($scope.name, $scope.IDNum).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('实名认证成功');
				$location.url($scope.backURL);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}
});
//修改登录密码 DONE
myControllers.controller('UserPassModifyCtrl', function ($scope, $location, PasswordService, AuthService) {
	$scope.oldPassword = '';
	$scope.newPassword = '';
	$scope.surePassword = '';

	$scope.changePass = function () {
		if ($scope.oldPassword == '') {
			X.tip('请输入原登录密码');
			return false;
		}
		if (!/^\w{6,16}$/.test($scope.oldPassword) || /^\d+$/.test($scope.oldPassword) || /^([a-zA-Z]+)$/.test($scope.oldPassword)) {
			X.tip('原登录密码输入错误');
			return false;
		}
		if ($scope.newPassword == '') {
			X.tip('请输入新密码');
			return false;
		}
		if (!/^\w{6,16}$/.test($scope.newPassword) || /^\d+$/.test($scope.newPassword) || /^([a-zA-Z]+)$/.test($scope.newPassword)) {
			X.tip('密码为6-16位数字和字母组成');
			return false;
		}
		if ($scope.surePassword == '') {
			X.tip('请输入确认密码');
			return false;
		}
		if ($scope.surePassword != $scope.newPassword) {
			X.tip('新密码与确认密码不一致');
			return false;
		}
		if ($scope.oldPassword.length < 6) {
			X.tip('原登录密码错误');
			return false;
		}
		if ($scope.newPassword == $scope.oldPassword) {
			X.tip('新密码不能与原始密码相同');
			return false;
		}
		X.loading.show();
		PasswordService.loginPwdModify($scope.oldPassword, $scope.newPassword).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('密码修改成功，请重新登录');
				AuthService.signOut();
				$location.path('/login');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}
});
//设置提现密码 DONE
myControllers.controller('TradePassSetCtrl', function ($scope, $location, PasswordService) {
	$scope.backURL = $location.search()['backURL'] || '/myInfo';
	$scope.password = '';
	$scope.surePassword = '';

	$scope.tradePassSet = function () {
		if ($scope.password == '') {
			X.tip('请输入提现密码');
			return false;
		}
		if (!/^\d{6}$/.test($scope.password)) {
			X.tip('提现密码为6位数字');
			return false;
		}
		if ($scope.surePassword == '') {
			X.tip('请输入确认密码');
			return false;
		}
		if ($scope.password != $scope.surePassword) {
			X.tip('两次密码不一致');
			return false;
		}
		X.loading.show();
		PasswordService.PwdSet($scope.password, $scope.surePassword).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('提现密码设置成功');
				$location.url($scope.backURL);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};
});
//修改提现密码 DONE
myControllers.controller('TradePassModifyCtrl', function ($scope, $location, PasswordService) {
	$scope.oldPwd = '';
	$scope.newPwd = '';
	$scope.surePwd = '';

	$scope.tradePassModify = function () {
		if ($scope.oldPwd == '') {
			X.tip('请输入原始提现密码');
			return false;
		}
		if (!/^\d{6}$/.test($scope.oldPwd)) {
			X.tip('原始提现密码为6位数字');
			return false;
		}
		if ($scope.newPwd == '') {
			X.tip('请输入新提现密码');
			return false;
		}
		if (!/^\d{6}$/.test($scope.newPwd)) {
			X.tip('提现密码为6位数字');
			return false;
		}
		if ($scope.surePwd == '') {
			X.tip('请输入确认密码');
			return false;
		}
		if ($scope.surePwd != $scope.newPwd) {
			X.tip('新密码与确认密码不一致');
			return false;
		}
		if ($scope.newPwd == $scope.oldPwd) {
			X.tip('新密码不能与原始密码相同');
			return false;
		}
		X.loading.show();
		PasswordService.PwdModify($scope.newPwd, $scope.oldPwd).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('提现密码修改成功');
				$location.path('/myInfo');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}
});
//找回提现密码 DONE
myControllers.controller('ResetTradePassCtrl', function ($scope, $location, $q, PasswordService, UserService) {
	var timer = null;
	$scope.backURL = $location.search()['backURL'] || '/myInfo';
	$scope.mobile = '';
	$scope.hideMobile = '';
	$scope.checkCode = '';
	$scope.password = '';
	$scope.surePassword = '';
	$scope.time = 0;

	X.loading.show();
	$q.all({
		userInfo: UserService.getUserInfo()
	}).then(function (res) {
		var userInfoData = res.userInfo.data;
		if (userInfoData.code == 100) {
			$scope.mobile = userInfoData.data['loginMobileNoHidden'];
			$scope.hideMobile = userInfoData.data['loginMobile'];
		} else {
			X.tip(userInfoData['resultMsg']);
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	$scope.resetTradePassInfo = function () {
		if ($scope.checkCode == '') {
			X.tip('请输入验证码');
			return false;
		}
		if (!/^\d{6}$/.test($scope.checkCode)) {
			X.tip('验证码输入有误');
			return false;
		}
		if ($scope.password == '') {
			X.tip('请输入提现密码');
			return false;
		}
		if (!/^\d{6}$/.test($scope.password)) {
			X.tip('提现密码为6位数字');
			return false;
		}
		if ($scope.surePassword == '') {
			X.tip('请输入确认密码');
			return false;
		}
		if ($scope.surePassword != $scope.password) {
			X.tip('提现密码与确认密码不符');
			return false;
		}
		//重置提现密码服务
		X.loading.show();
		PasswordService.resetWithdrawPwd($scope.password, $scope.checkCode).then(function (res) {
			var resetWithdrawPwdData = res.data;
			if (resetWithdrawPwdData.code == 100) {
				X.tip('提现密码修改成功');
				$location.url($scope.backURL);
			} else {
				X.tip(resetWithdrawPwdData['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//获取验证码
	$scope.getPasswordCode = function () {
		//发送验证码请求
		PasswordService.sendPasswordCode($scope.mobile).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$scope.time = 60;
				X.tip('验证码已发送至手机，请注意查收');
				timerFn();
			} else if (data.code == 101) {
				$scope.time = data.data.interval;
				timerFn();
			}
			else {
				X.tip(data['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//倒计时
	function timerFn() {
		timer = setInterval(function () {
			if ($scope.time > 0) {
				$scope.$apply(function () {
					$scope.time--;
				});
			} else {
				timer && clearTimeout(timer);
			}
		}, 1000);
	}

	//卸载页面的定时器
	$scope.$on('$destroy', function () {
		timer && clearTimeout(timer);
	});
});
//个人中心 DONE
myControllers.controller('MyHomeCtrl', function ($scope, $q, $location, UserService) {
	$scope.user = {};
	$scope.bankCards = [];

	X.loading.show();
	$q.all({
		userInfo: UserService.getUserInfo(),//获取用户基本信息
		balance: UserService.getBalance(),//获取用户账余额
		bankCards: UserService.getBankCards()//获取银行卡
	}).then(function (res) {
		var userInfoData = res.userInfo.data;
		var balanceData = res.balance.data;
		var bankCardsData = res.bankCards.data;

		if (userInfoData.code == 100 && balanceData.code == 100 && bankCardsData.code == 100) {
			$scope.user = userInfoData.data;
			$scope.user.balance = balanceData.data.balance;
			$scope.bankCards = bankCardsData.data;
		} else {
			if (userInfoData.code != 100) {
				X.tip(userInfoData['resultMsg']);
			} else if (balanceData.code != 100) {
				X.tip(balanceData['resultMsg']);
			} else if (bankCardsData.code != 100) {
				X.tip(bankCardsData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//去提现
	$scope.doWithdraw = function () {
		if (!$scope.user.named) {
			X.dialog.confirm('您还未实名认证，请先实名认证', {
				notify: function (nt) {
					if (nt == 1) {
						bootURL('/identification?backURL=/myHome');
					}
				}
			});
			return;
		}
		if ($scope.user.balance == 0) {
			X.tip('您的账户没有可提金额');
			return;
		}
		//没有银行卡提示添加银行卡
		if (!$scope.bankCards.length) {
			X.dialog.confirm('提款前请先添加提款银行卡', {
				sureBtn: '添加银行卡', notify: function (nt) {
					if (nt == 1) {
						//跳转到添加银行卡页面
						bootURL('/addBankCard?backURL=/myHome');
					}
				}
			});
			return;
		}
		//没有设置提现密码的提示去设置提现密码
		if (!$scope.user.withdrawPw) {
			X.dialog.confirm('您还未设置提现密码', {
				sureBtn: '马上设置', notify: function (nt) {
					if (nt == 1) {
						bootURL('/tradePassSet?backURL=/withdraw');
					}
				}
			});
			return;
		}
		//银行卡列表可能有多张银行卡，没法校验用户到底选择哪一张卡，该判断放到用户发起提现时候后端校验
		// if ($scope.cardInfo.province == null || $scope.cardInfo.city == null || $scope.cardInfo['subbranch'] == null) {
		//     X.dialog.confirm('您的银行卡信息不全<br>请先完善银行卡信息', {
		//         sureBtn: '去完善', notify: function (nt) {
		//             if (nt == 1) {
		//                 bootURL('/bankInfo');
		//             }
		//         }
		//     });
		//     return;
		// }

		$location.path('/withdraw');
	};

	//引导跳转
	function bootURL(url) {
		$scope.$apply(function () {
			$location.url(url);
		});
	}
});
//我的详情 DONE
myControllers.controller('MyInfoCtrl', function ($scope, $rootScope, $q, $location,SystemService ,LoginService, UserService, AuthService) {
	$scope.user = {};
	$scope.bankCards = [];

	X.loading.show();
	$q.all({userInfo: UserService.getUserInfo(), bankCards: UserService.getBankCards()}).then(function (res) {
		var userInfoData = res.userInfo.data;
		var bankCardsData = res.bankCards.data;
		if (userInfoData.code == 100 && bankCardsData.code == 100) {
			$scope.user = userInfoData.data;
			$scope.bankCards = bankCardsData.data;
		} else {
			if (userInfoData.code != 100) {
				X.tip(userInfoData['resultMsg']);
			} else if (bankCardsData.code != 100) {
				X.tip(bankCardsData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//拨打电话或者跳转支付宝认证
	$scope.telTip = function () {
		$scope.cellPhone = SystemService.cellPhoneNumber();
		X.dialog.alert('如需要更换或解绑支付宝账号，请 <br>联系客服电话 <a class="txt-blue" href=' + $scope.cellPhone.cellPhoneATag + '>' + $scope.cellPhone.cellPhone + '</a>');
	};

	$scope.goCheckAli = function(){
		// X.dialog.alert('使用支付宝进行首次入金操作后，即可自动 <br>绑定支付宝账号。<a class="txt-red" href="">' + '去充值' + '</a>')
		X.dialog.confirm('使用支付宝进行首次入金操作后，即可自动<br>绑定支付宝账号。', {
			sureBtn: '去充值', notify: function (nt) {
				if (nt == 1) {
					$scope.$apply(function () {
						$location.url('/alipay?backURL=/myInfo');
					})
				}
			}
		});
	};

	//退出登陆
	$scope.logout = function () {
		X.dialog.confirm('确定要退出当前账号吗？', {
			notify: function (nt) {
				if (nt == 1) {
					signOut();
				}
			}
		});
	};

	//退出登录
	function signOut() {
		X.loading.show();
		LoginService.logout().then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				AuthService.signOut();
				$location.url('/index');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}
});
//公告列表
myControllers.controller('NoticeCtrl', function ($scope, $q, $location, NoticeService) {
	$scope.items = [];
	$scope.pageIndex = 1;
	$scope.totalPage = 1;
	//获取公告列表
	$scope.getNoticeList = function (page) {
		var pageSize = 10;
		X.loading.show();
		NoticeService.getNoticeList(page, pageSize).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var noticeData = data.data;
				$scope.pageIndex = noticeData['pageIndex'];
				$scope.totalPage = noticeData['totalPage'];
				if (page == 1) {
					$scope.items = noticeData.items;
				} else {
					$scope.items = $scope.items.concat(noticeData.items);
				}
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	$scope.getNoticeList($scope.pageIndex);
});
//公告详情 DONE
myControllers.controller('NoticeDetailCtrl', function ($scope, $q, $location, $sce, $routeParams, NoticeService) {
	var noticeId = $routeParams.noticeId;
	if (!noticeId) {
		X.tip('公告ID不能为空');
		$location.path('/notice');
		return;
	}

	$scope.notice = {};

	X.loading.show();
	$q.all({
		noticeDetail: NoticeService.getNoticeById(noticeId)
	}).then(function (res) {
		var noticeDetail = res.noticeDetail.data;
		if (noticeDetail.code == 100) {
			$scope.notice = noticeDetail.data;
			$scope.notice.noticeContent = $sce.trustAsHtml(noticeDetail.data['noticeContent']);
		} else {
			X.tip(noticeDetail['resultMsg']);
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});
});
//客服 DONE
myControllers.controller('HelpCtrl', function ($scope, $location) {
	$scope.backURL = $location.search()['backURL'] || '/index';
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}

	$scope.toHelpCenter = function () {
		if ($scope.showHeader) {
			$location.path('/helpCenter');
		} else {
			window.location = 'jumpCenter::suggestion';
		}
	};
});
//客服中心静态详情 DONE
myControllers.controller('HelpDetailCtrl', function ($scope, $location, $sce, $routeParams) {
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}
	var detailId = $routeParams['helpDetailId'];
	var helpObjs = {
		'QA0001': {
			title: '用户名无法登录怎么办？',
			content: $sce.trustAsHtml('<p>使用注册手机号码也可以登录。</p>')
		},
		'QA0002': {
			title: '忘记登录密码如何获取？',
			content: $sce.trustAsHtml('<p>可以用注册手机找回密码。</p><P>操作流程：选择登录 —— 点击忘记密码 —— 输入手机号码 —— 获取验证码 —— 输入新登录密码 —— 修改成功。</P>')
		},
		'QA0003': {
			title: '获取短信验证码失败怎么办？',
			content: $sce.trustAsHtml('<p>检查是否输错手机号码。如无问题，请致电400-8888-566（9点到17点半）或15575990597（17点半到21点）客服热线进行处理。</p>')
		},
		'QA0004': {
			title: '登录的方式有哪些？',
			content: $sce.trustAsHtml('<p>支持微信公众号、app、pc进行登录。</P>')
		},
		'QB0001': {
			title: '如何充值？',
			content: $sce.trustAsHtml('<p>微信端/APP端目前支持银行卡快捷充值、支付宝转账，在线充值立即到账。</p>')
		},
		'QB0002': {
			title: '充值提现有什么限制吗？提现多久到账？',
			content: $sce.trustAsHtml('<p>1、充值最低100元。</p><p>2、交易结算后、或者账户有余额，可随时申请提出现金。</p><p>3、单次提款金额最低100元起提，提款采用银行批量转账，到账时间以银行为准，一般处理时间需要1-2个工作日左右，节假日将延后处理。</p>')
		},
		'QB0003': {
			title: '为什么银行卡会充值失败？',
			content: $sce.trustAsHtml('<p>1、确保银行卡号、姓名、银行预留身份号、身份证号、开户银行是否保持一致。</p><p>2、充值失败可致电400-8888-566（9点到17点半）或15575990597（17点半到21点）获取帮助。</p>')
		},
		'QB0004': {
			title: '快捷支付收不到验证码怎么办？',
			content: $sce.trustAsHtml('<p>1、请核实手机号是否为该银行卡的绑定手机，手机是否设置短信拦截功能。</p><p>2、因支付验证码是由第三方支付公司发出的，如仍收不到验证码，请致电400-8888-566（9点到17点半）或15575990597（17点半到21点）客服热线咨询并获取帮助。</p>')
		},
		'QC0001': {
			title: '什么是履约保证金？',
			content: $sce.trustAsHtml('<p>1、履约保证金为点买人委托平台冻结用于履约交易亏损赔付义务的保证金。</p><p>2、点买人以冻结的履约保证金作为承担交易亏损赔付的上限。</p><p>3、多出上限部分的亏损全部由合作的投资人承担。</p><p>4、合作交易结束后，根据结算结果，如交易盈利，点买人冻结的履约保证金全额退还。如交易亏损，从冻结的履约保证金中，扣减操盘人所应承担的亏损赔付额，扣减后余额退还。</p>')
		},
		'QC0002': {
			title: '交易的履约保证金是固定的还是浮动的？',
			content: $sce.trustAsHtml('<p>目前是固定的，根据投资人选择对应的交易手数叠加。</p>')
		},
		'QC0003': {
			title: '交易过程中可以追加履约保证金吗？',
			content: $sce.trustAsHtml('<p>交易中不能追加履约保证金，所以开仓的时候，建议选择高保证金，下单成功后，可以自行设置止盈止损。</p>')
		},
		'QC0004': {
			title: '风险较高容易被平仓，如何选择保证金档次？',
			content: $sce.trustAsHtml('<p>1、每个品种都有多个保证金档次可选的，客户可以按照自己的风险承受能力自由选择每笔的保证金档次。</p><p>2、比如客户可以用1340保证金做一手原油，也可以2010、2680的保证金做一手的原油，在开仓界面，触发止损中选择即可。履约保证金高，不容易被平仓。</p>')
		},
		'QC0005': {
			title: '交易需要支付什么费用？',
			content: $sce.trustAsHtml('<p>交易过程中只需要支付每笔的交易综合费，不交易不收费，下单未成功撤单也不收费。</p>')
		},
		'QC0006': {
			title: '交易时间费用和汇率是固定的吗？',
			content: $sce.trustAsHtml('<p>关于交易时间和交易综合费 、汇率，因期货公司变动，平台有可能进行调整，以平台公布的最新数据为准。</p>')
		},
		'QD0001': {
			title: '盈亏如何分配？',
			content: $sce.trustAsHtml('<p>1、点买人与投资人合作交易，止盈金额以内的盈利，点买人拿90%，投资人拿10%。</p><p>2、超出止盈部分的盈利全部归合作的投资人所有，同时超出止亏部分的亏损也全部由投资人承担。</p>')
		},
		'QD0002': {
			title: '如何设置止盈止损？是否有限制？',
			content: $sce.trustAsHtml('<p>下单成功后，在持仓信息里可自定义设置，止盈、止损有最大限制。</p>')
		},
		'QD0003': {
			title: '国际期货的持仓盈亏是如何计算的？',
			content: $sce.trustAsHtml('<p>美原油、美黄金、美白银、富时A50是美元计价盈亏，已经在持仓里边自动按照固定的汇率换算成人民币，平仓会自动结算成人民币。恒指是以港币计价盈亏，已经在持仓里边自动按照固定的汇率换算成人民币，平仓会自动结算成人民币。德指是以欧元计价盈亏，已经在持仓里边自动按照固定的汇率换算成人民币，平仓会自动结算成人民币。</p>')
		},
		'QD0004': {
			title: '是否支持限定价格卖出？',
			content: $sce.trustAsHtml('<p>暂时不支持。可以通过修改止盈止损去实现。</p>')
		}
	};

	$scope.helpObj = helpObjs[detailId];
});
//客服中心 DONE
myControllers.controller('HelpCenterCtrl', function ($scope, UserService) {
	var pageSize = 6;
	$scope.helpList = [];
	$scope.currPage = 1;
	$scope.totalPage = 1;
	//
	$scope.getHelpList = function (page) {
		X.loading.show();
		UserService.getMsgPage(page, pageSize).then(function (res) {
			var msgListData = res.data;
			if (msgListData.code == 100) {
				var data = msgListData.data;
				$scope.helpList = $scope.helpList.concat(data['items']);
				$scope.currPage = data['pageIndex'];
				$scope.totalPage = data['totalPage'];
			} else {
				X.tip(msgListData['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	$scope.getHelpList(1);
});
//客服中心提问 DONE
myControllers.controller('HelpAskCtrl', function ($scope, $location, UserService) {
	//留言类别
	$scope.types = [
		'请选择留言类型',
		'账户充值及提款问题',
		'点买点卖问题',
		'结算问题',
		'我要投诉',
		'意见反馈',
		'其他问题'
	];
	$scope.type = '请选择留言类型';
	$scope.content = '';

	//用户发起留言
	$scope.postMsg = function () {
		if ($scope.type == '请选择留言类型') {
			X.tip('请选择留言类型');
			return;
		}

		if (X.strLen($scope.content) < 1 || X.strLen($scope.content) > 300) {
			X.tip('留言内容不符合规范');
			return;
		}
		X.loading.show();
		UserService.postMsg($scope.type, '', $scope.content).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('留言成功');
				$location.path('/helpCenter');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};
});
//外盘点买
myControllers.controller('OuterTradeCtrl', function ($scope, $q, $routeParams, TradeService, StockService, UserService, SystemService) {
	$scope.uuid = SystemService.uuid();
	$scope.commodityNo = $routeParams.commodityNo || 'CL';
	$scope.type = $routeParams.type || '2';
	if ($scope.type != '1') {
		$scope.type = '2';
	}
	var chartOpts = {
		sline: {
			CL: {
				wrap: 'sline-wrap-' + $scope.uuid,
				scale: 2
			},
			GC: {
				wrap: 'sline-wrap-' + $scope.uuid,
				scale: 1
			},
			HSI: {
				wrap: 'sline-wrap-' + $scope.uuid,
				scale: 0
			},
			MHI: {
				wrap: 'sline-wrap-' + $scope.uuid,
				scale: 0
			},
			SI: {
				wrap: 'sline-wrap-' + $scope.uuid,
				scale: 3
			},
			DAX: {
				wrap: 'sline-wrap-' + $scope.uuid,
				scale: 1
			},
			CN: {
				wrap: 'sline-wrap-' + $scope.uuid,
				scale: 1
			}
		},
		kline: {
			CL: {
				wrap: 'kline-wrap-' + $scope.uuid
			},
			GC: {
				wrap: 'kline-wrap-' + $scope.uuid
			},
			HSI: {
				wrap: 'kline-wrap-' + $scope.uuid
			},
			MHI: {
				wrap: 'kline-wrap-' + $scope.uuid
			},
			SI: {
				wrap: 'kline-wrap-' + $scope.uuid
			},
			DAX: {
				wrap: 'kline-wrap-' + $scope.uuid
			},
			CN: {
				wrap: 'kline-wrap-' + $scope.uuid
			}
		},
		tline: {
			CL: {
				wrap: 'tline-wrap-' + $scope.uuid,
				unit: 0.01,
				multiple: 2
			},
			GC: {
				wrap: 'tline-wrap-' + $scope.uuid,
				unit: 0.1,
				multiple: 2
			},
			HSI: {
				wrap: 'tline-wrap-' + $scope.uuid,
				unit: 1,
				multiple: 2
			},
			MHI: {
				wrap: 'tline-wrap-' + $scope.uuid,
				unit: 1,
				multiple: 2
			},
			SI: {
				wrap: 'tline-wrap-' + $scope.uuid,
				unit: 0.005,
				multiple: 2
			},
			DAX: {
				wrap: 'tline-wrap-' + $scope.uuid,
				unit: 0.5,
				multiple: 2
			},
			CN: {
				wrap: 'tline-wrap-' + $scope.uuid,
				unit: 2.5,
				multiple: 2
			}
		}
	};
	//分时数据上一次查询是否已经完成，是否开启交易
	var isLoadFuturesQuote = true, isTrade = false;
	var tChart, sChart, kChart, QUOTE_DATA, CACHE_KLINE, CACHE_1KLINE, CACHE_3KLINE, CACHE_5KLINE, CACHE_15KLINE,
		TEMP_1K, TEMP_3K, TEMP_5K, TEMP_15K;
	var sessionStorage = window.sessionStorage;
	var session = sessionStorage.getItem('sessionID');
	$scope.balance = 0;
	$scope.commodityTitles = {
		CL: '美原油',
		GC: '美黄金',
		SI: '美白银',
		HSI: '恒指',
		MHI: '小恒指',
		CN: '富时A50',
		DAX: '德指'
	};
	$scope.showMenu = false;
	$scope.futureInfo = {};
	$scope.currType = 'sline';
	$scope.tips = '';
	$scope.isInPeriod = false;
	//K线相关
	$scope.showKillwrap = false;
	$scope.currKLineIndex = 4;
	$scope.klineInfo = null;
	$scope.klineTypes = [{
		title: '1分钟',
		type: 'oneMKline',
		dt: 'hm'
	}, {
		title: '3分钟',
		type: 'threeMKline',
		dt: 'hm'
	}, {
		title: '5分钟',
		type: 'fiveMKline',
		dt: 'hm'
	}, {
		title: '15分钟',
		type: 'fifteenMKline',
		dt: 'hm'
	}, {
		title: '日线',
		type: 'dayKline',
		dt: 'YMD'
	}];

	X.loading.show();
	$q.all({
		risk: TradeService.getRisk($scope.commodityNo),
		quote: StockService.getFuturesQuote($scope.commodityNo)
	}).then(function (res) {
		var riskData = res.risk.data,
			quoteData = res.quote.data;
		session && getBalance();
		if (riskData.code == 100 && quoteData.code == 100) {
			processQuoteData(quoteData.data);
			init(riskData.data);
			$scope.switchPanel('sline');
			$scope.klineInfo = $scope.klineTypes[$scope.currKLineIndex];
		} else {
			if (riskData.code != 100) {
				X.tip(riskData['resultMsg']);
			} else if (quoteData.code != 100) {
				X.tip(quoteData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	$scope.balance = 0;
	$scope.txtLinkObj = $scope.type == 1 ? {
		header: {
			text: '换成实盘',
			link: '#/outerTrade/' + $scope.commodityNo + '/2'
		},
		corner: {
			text: '申请模拟币',
			link: '#/getSimCoin',
			title: '模拟币'
		}
	} : {
		header: {
			text: '规则',
			link: '#/tradeRule' + $scope.commodityNo
		},
		corner: {
			text: '立即充值',
			link: '#/payType',
			title: '账户余额'
		}
	};

	function getBalance() {
		var http;
		if ($scope.type == 1) {
			http = UserService.getSimBalance();
		} else {
			http = UserService.getBalance();
		}

		http.then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				if ($scope.type == 2) {
					$scope.balance = data.data.balance;
				} else {
					var balanceArr = data.data.split(';');
					X.log(balanceArr);
					$scope.balance = balanceArr[0] - 0;
				}
			} else {
				X.tip(data['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	$scope.switchPanel = function (type) {
		//双判断是为了实现第一次切换不出现菜单
		if ($scope.currType == 'kline' && type == 'kline') {
			$scope.showKillwrap = !$scope.showKillwrap;
		} else {
			$scope.showKillwrap = false;
		}
		$scope.currType = type;
		if (type == 'sline' && !sChart) {
			getFuturesSline();
		} else if (type == 'tline' && !tChart) {
			drawTick();
		} else if (type == 'kline' && !kChart) {
			getFuturesKline();
		}
	};

	$scope.switchKL = function (index, $event) {
		$event.stopPropagation();//阻止事件冒泡到上层节点而触发上级的事件
		$scope.showKillwrap = false;
		$scope.klineInfo = $scope.klineTypes[index];
		if (($scope.klineInfo.type == 'oneMKline' && !CACHE_1KLINE)
			|| ($scope.klineInfo.type == 'threeMKline' && !CACHE_3KLINE)
			|| ($scope.klineInfo.type == 'fiveMKline' && !CACHE_5KLINE)
			|| ($scope.klineInfo.type == 'fifteenMKline' && !CACHE_15KLINE)
			|| ($scope.klineInfo.type == 'dayKline' && !CACHE_KLINE)) {
			getFuturesKline();
		} else {
			if ($scope.klineInfo.type == 'oneMKline' && !!CACHE_1KLINE) {
				kChart.draw(CACHE_1KLINE);
			} else if ($scope.klineInfo.type == 'threeMKline' && !!CACHE_3KLINE) {
				kChart.draw(CACHE_3KLINE);
			} else if ($scope.klineInfo.type == 'fiveMKline' && !!CACHE_5KLINE) {
				kChart.draw(CACHE_5KLINE);
			} else if ($scope.klineInfo.type == 'fifteenMKline' && !!CACHE_15KLINE) {
				kChart.draw(CACHE_15KLINE);
			} else if ($scope.klineInfo.type == 'dayKline' && !!CACHE_KLINE) {
				kChart.draw(CACHE_KLINE);
			}
		}
	};

	function init(data) {
		var serverTime = data['nowTime'];
		var risk = JSON.parse(data.strRisk);
		//X.log(risk);
		isTrade = risk['isTrade'].value == '1';
		//配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
		var holiday = SystemService.parseHoliday(risk['holiday'].value);
		var tradeTime = SystemService.parsePeriod(risk['tradingTimeLimit'].value);
		var quoteTime = SystemService.parsePeriod(risk['quoteTime'].value);
		SystemService.setCurrentTime(serverTime);
		SystemService.setCurrentCurrencyType('USD');
		SystemService.setHoliday(holiday);
		SystemService.setTradePeriod(tradeTime);
		SystemService.setQuotePeriod(quoteTime, $scope.commodityNo);

		getFuturesQuote(true);
		X.engine.addTask(getFuturesQuote, 500);
		X.engine.start();
	}

	function resize() {
		var els = [
			'#sline-wrap-' + $scope.uuid,
			'#kline-wrap-' + $scope.uuid,
			'#tline-wrap-' + $scope.uuid
		];
		var height = $(window).height();
		els.forEach(function (id) {
			//var top = $(id).offset().top;
			var top = 223;//上面获取分时图的上偏移，由于SPA切换的时候DOM会出现模板重叠导致top计算出现错误，因此用固定值计算
			var h = height - top - 103 - 5;
			$(id).height(h);
		});
	}

	function getFuturesSline() {
		StockService.getFuturesSline($scope.commodityNo).then(function (res) {
			var sLineData = res.data;
			if (sLineData.code == 100) {
				drawSline(sLineData.data);
			} else {
				X.tip(sLineData['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	function getFuturesKline() {
		StockService.getFuturesKline($scope.commodityNo, $scope.klineInfo.type).then(function (res) {
			var kLineData = res.data;
			if (kLineData.code == 100) {
				drawKline(kLineData.data)
			} else {
				X.tip(kLineData['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	function drawSline(sLineDataStr) {
		resize();
		if (!QUOTE_DATA)return;
		var slineData = sLineDataStr.split(';');
		var data = {}, lastTime;
		slineData.forEach(function (str) {
			var arr = str.split(',');
			lastTime = X.formatDate(X.toInt(arr[0]), 'hm') - 0;
			data[lastTime] = {
				current: X.toFloat(arr[1]),
				volume: 0,
				time: lastTime
			};
		});

		sChart = new X.Sline(chartOpts['sline'][$scope.commodityNo]);
		sChart.draw({
			data: data,
			close: X.toFloat(QUOTE_DATA['yesterdayPrice']),
			high: X.toFloat(QUOTE_DATA['highPrice']),
			low: X.toFloat(QUOTE_DATA['lowPrice']),
			quoteTime: lastTime,
			code: $scope.commodityNo,
			period: SystemService.getRealPeriod($scope.commodityNo, lastTime),
			isIntl: isIntl($scope.commodityNo)
		});
	}

	function drawKline(dataStr) {
		var klineData = dataStr.split(';');
		if ($scope.klineInfo.type == 'dayKline') {
			//后台给的数据是反的(┬＿┬)
			klineData.reverse();
		}
		var data = [];
		klineData.forEach(function (str) {
			//时间+成交量+最高价+最低价+开盘价+最新价
			var arr = str.split(',');
			var o = {
				timestamp: (arr[0] - 0),
				time: X.formatDate(arr[0] - 0, $scope.klineInfo.dt),
				open: X.toFloat(arr[4]),
				//close: X.toFloat(arr[4]),
				high: X.toFloat(arr[2]),
				low: X.toFloat(arr[3]),
				price: X.toFloat(arr[5])
			};
			data.push(o);
		});
		if (!kChart) {
			kChart = new X.Kline(chartOpts['kline'][$scope.commodityNo]);
		}
		kChart.draw(data);
		if ($scope.klineInfo.type == 'oneMKline') {
			CACHE_1KLINE = data;
		} else if ($scope.klineInfo.type == 'threeMKline') {
			CACHE_3KLINE = data;
		} else if ($scope.klineInfo.type == 'fiveMKline') {
			CACHE_5KLINE = data;
		} else if ($scope.klineInfo.type == 'fifteenMKline') {
			CACHE_15KLINE = data;
		} else {
			CACHE_KLINE = data;
		}
	}

	function drawTick() {
		tChart = new X.Tick(chartOpts['tline'][$scope.commodityNo]);
		tChart.draw({
			time: QUOTE_DATA.time,
			price: X.toFloat(QUOTE_DATA.newPrice)
		});
	}

	function perDrawSline(data) {
		var o = {
			current: X.toFloat(data['newPrice']),
			volume: 0,
			time: X.formatDate(data.time, 'hm') - 0
		};

		sChart && sChart.perDraw(o, {
			close: X.toFloat(data['yesterdayPrice']),
			high: X.toFloat(data['highPrice']),
			low: X.toFloat(data['lowPrice']),
			quoteTime: o.time,
			code: $scope.commodityNo,
			period: SystemService.getRealPeriod($scope.commodityNo, o.time),
			isIntl: isIntl($scope.commodityNo)
		});
	}

	//更新最新K线信息
	function perDrawKline(data) {
		// 累加和更新数据
		if (data['newPrice'] == 0 || !$scope.klineInfo) {
			return;
		}

		var last, nextTime, o;
		if (CACHE_KLINE && CACHE_KLINE.length) {
			last = CACHE_KLINE[CACHE_KLINE.length - 1];
			o = {
				timestamp: data.time,
				time: X.formatDate(data.time, 'YMD'),
				open: data['openPrice'],
				//close: data['yesterdayPrice'],
				high: data['highPrice'],
				low: data['lowPrice'],
				price: data['newPrice']// 即时数据，使用当前价格
			};
			if (last.time === o.time) {
				CACHE_KLINE[CACHE_KLINE.length - 1] = o;
			} else {
				CACHE_KLINE.push(o);
			}
		}

		if (CACHE_1KLINE && CACHE_1KLINE.length) {
			last = CACHE_1KLINE[CACHE_1KLINE.length - 1];
			nextTime = last.timestamp + 60000;
			if (data.time < nextTime) {
				CACHE_1KLINE[CACHE_1KLINE.length - 1] = {
					timestamp: last['timestamp'],
					time: last['time'],
					open: last['open'],
					high: Math.max(data['newPrice'], last['high']),
					low: Math.min(data['newPrice'], last['low']),
					price: data['newPrice']
				};
			} else {
				TEMP_1K = {
					timestamp: data.time,
					time: X.formatDate(data.time, 'hm'),
					open: data['newPrice'],
					high: data['newPrice'],
					low: data['newPrice'],
					price: data['newPrice']
				};
				CACHE_1KLINE.push(TEMP_1K);
			}
		}

		if (CACHE_3KLINE && CACHE_3KLINE.length) {
			last = CACHE_3KLINE[CACHE_3KLINE.length - 1];
			nextTime = last.timestamp + 180000;
			if (data.time < nextTime) {
				CACHE_3KLINE[CACHE_3KLINE.length - 1] = {
					timestamp: last['timestamp'],
					time: last['time'],
					open: last['open'],
					high: Math.max(data['newPrice'], last['high']),
					low: Math.min(data['newPrice'], last['low']),
					price: data['newPrice']
				};
			} else {
				TEMP_3K = {
					timestamp: data.time,
					time: X.formatDate(data.time, 'hm'),
					open: data['newPrice'],
					high: data['newPrice'],
					low: data['newPrice'],
					price: data['newPrice']
				};
				CACHE_3KLINE.push(TEMP_3K);
			}
		}

		if (CACHE_5KLINE && CACHE_5KLINE.length) {
			last = CACHE_5KLINE[CACHE_5KLINE.length - 1];
			nextTime = last.timestamp + 300000;
			if (data.time < nextTime) {
				CACHE_5KLINE[CACHE_5KLINE.length - 1] = {
					timestamp: last['timestamp'],
					time: last['time'],
					open: last['open'],
					high: Math.max(data['newPrice'], last['high']),
					low: Math.min(data['newPrice'], last['low']),
					price: data['newPrice']
				};
			} else {
				TEMP_5K = {
					timestamp: data.time,
					time: X.formatDate(data.time, 'hm'),
					open: data['newPrice'],
					high: data['newPrice'],
					low: data['newPrice'],
					price: data['newPrice']
				};
				CACHE_5KLINE.push(TEMP_5K);
			}
		}

		if (CACHE_15KLINE && CACHE_15KLINE.length) {
			last = CACHE_15KLINE[CACHE_15KLINE.length - 1];
			nextTime = last.timestamp + 900000;
			if (data.time < nextTime) {
				CACHE_15KLINE[CACHE_15KLINE.length - 1] = {
					timestamp: last['timestamp'],
					time: last['time'],
					open: last['open'],
					high: Math.max(data['newPrice'], last['high']),
					low: Math.min(data['newPrice'], last['low']),
					price: data['newPrice']
				};
			} else {
				TEMP_15K = {
					timestamp: data.time,
					time: X.formatDate(data.time, 'hm'),
					open: data['newPrice'],
					high: data['newPrice'],
					low: data['newPrice'],
					price: data['newPrice']
				};
				CACHE_15KLINE.push(TEMP_15K);
			}
		}

		var currData;
		if ($scope.klineInfo.type == 'oneMKline') {
			currData = CACHE_1KLINE;
		} else if ($scope.klineInfo.type == 'threeMKline') {
			currData = CACHE_3KLINE;
		} else if ($scope.klineInfo.type == 'fiveMKline') {
			currData = CACHE_5KLINE;
		} else if ($scope.klineInfo.type == 'fifteenMKline') {
			currData = CACHE_15KLINE;
		} else {
			currData = CACHE_KLINE;
		}

		kChart && kChart.draw(currData);
	}

	function perDrawTick(data) {
		tChart && tChart.draw({
			time: data.time,
			price: X.toFloat(data.newPrice)
		});
	}

	function getFuturesQuote(flag) {
		//判断是否是在交易时间段内
		//PS要把时间段的提示绑定到页面上，因为作用域的$scope问题，当赋值完成以后必须要在执行angular的原生方法激活数据的双向绑定否则新赋值不能双向绑定到页面
		if (isTrade) {
			$scope.isInPeriod = SystemService.isInPeriod($scope.commodityNo, 'trade');
			if ($scope.isInPeriod) {
				$scope.tips = '本时段' + SystemService.getTipsForTradeStopTime($scope.commodityNo);
			} else {
				$scope.tips = '已休市，' + SystemService.getTipsForNextTime($scope.commodityNo);
			}
		} else {
			$scope.isInPeriod = false;
			$scope.tips = '暂停交易';
		}
		var isInQuoteTime = SystemService.isInPeriod($scope.commodityNo, 'quote');

		if (!flag && !isInQuoteTime) {
			$scope.$apply();
		}

		//判断是否是在行情时间段内
		if (isLoadFuturesQuote && isInQuoteTime) {
			isLoadFuturesQuote = false;
			StockService.getFuturesQuote($scope.commodityNo).then(function (res) {
				isLoadFuturesQuote = true;
				var data = res.data;
				if (data.code == 100) {
					processQuoteData(data.data);
				} else {
					X.tip(data['resultMsg']);
				}
				X.loading.hide();
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}
	}

	function processQuoteData(data) {
		var futureArr;
		if (data) {
			futureArr = data.split(',');
			//合约编号, 时间,开盘价,昨收,涨跌值,涨跌幅,最高,最低,总手,最新价,对手买价,对手卖价,买量,卖量
			var baseNum = 50, buyNum = X.toInt(futureArr[12]), sellNum = X.toInt(futureArr[13]),
				buyNumRate = buyNum / baseNum * 100, sellNumRate = sellNum / baseNum * 100;
			if (buyNumRate > 100) {
				buyNumRate = 100;
			}
			if (sellNumRate > 100) {
				sellNumRate = 100;
			}
			QUOTE_DATA = {
				commodityTitle: $scope.commodityTitles[$scope.commodityNo],
				contractNo: futureArr[0],
				time: futureArr[1] - 0,
				openPrice: futureArr[2],
				yesterdayPrice: futureArr[3],
				changeValue: futureArr[4],
				changeQuote: futureArr[5],
				highPrice: futureArr[6],
				lowPrice: futureArr[7],
				total: X.sketchNumber(futureArr[8], 2),
				newPrice: futureArr[9],
				buyPrice: futureArr[10],
				sellPrice: futureArr[11],
				buyNum: buyNum,
				sellNum: sellNum,
				buyNumRate: buyNumRate,
				sellNumRate: sellNumRate
			};
			$scope.futureInfo = QUOTE_DATA;

			perDrawTick(QUOTE_DATA);
			perDrawSline(QUOTE_DATA);
			perDrawKline(QUOTE_DATA);
		}
	}

	function isIntl(commNo) {
		return commNo == 'GC' || commNo == 'CL' || commNo == 'SI' || commNo == 'DAX';
	}

	$scope.$on('$destroy', function () {
		X.engine.destroy();
	});
});
//外盘二级点买页面
myControllers.controller('OuterTradeBuyCtrl', function ($scope, $q, $routeParams, $location, StockService, TradeService, UserService, PacketService, SystemService) {
	$scope.commodityNo = $routeParams.commodityNo || 'CL';
	$scope.type = $routeParams.type || '2';
	if ($scope.type != '1') {
		$scope.type = '2';
	}
	$scope.buyChange = $routeParams.buyChange || 'buy';
	var amount = $location.search()['amount'],
		quitCloseRatio = $location.search()['quitCloseRatio'];

	var isLoadFuturesQuote = true,
		isTrade = false;
	$scope.tips = '';
	$scope.isInperiod = false;

	$scope.tradeIndex = 0;//交易数量索引
	$scope.highIndex = 0;//止盈索引
	$scope.lowIndex = 0;//止损索引
	$scope.tradeNumber = 0; //所选交易数量
	$scope.highMoney = 0; //所选止盈金额
	$scope.lowMoney = 0; //所选止损金额
	$scope.tradeNumList = [];//手数列表
	$scope.highMoneyList = [];//止盈列表
	$scope.lowMoneyList = [];//止损金额列表
	$scope.principal = 0;//保证金
	$scope.serviceMoney = 0;//所选交易的交易综合费
	$scope.showLossMoney = false;//止损金额弹出框
	$scope.showCountNum = false;//手数弹出框
	$scope.selectedLowMoney = 0;
	$scope.selectedCount = 0;
	$scope.divisionsNum = 3;//止损选择框的分割数
	$scope.countNum = 5;//手数选择器的分割数
	$scope.signAgreement = false;//是否签署协议
	$scope.futureInfo = {};
	$scope.tipBalance = 0; //红包余额
	$scope.usTipBalance = 0; //使用红包金额
	$scope.useTip = true; //是否使用红包

	X.loading.show();
	$q.all({
		userInfo: UserService.getUserInfo(),
		getRiskInfo: TradeService.getRisk($scope.commodityNo),
		quote: StockService.getFuturesQuote($scope.commodityNo),
		packet: PacketService.getPacketFundInfoData()
	}).then(function (res) {
		var userInfoData = res.userInfo.data,
			riskData = res.getRiskInfo.data,
			packetData = res.packet.data,
			quoteData = res.quote.data;
		if (userInfoData.code == 100 && riskData.code == 100 && quoteData.code == 100 && packetData.code == 100) {
			$scope.userInfo = userInfoData.data;
			$scope.tipBalance = packetData.data.tipBalance;
			if ($scope.tipBalance == 0) {
				$scope.useTip = false;
			}
			init(riskData.data);
			futureQuote(quoteData.data);
			//初始化止盈、止损、保证金和综合费
			$scope.chooseTradeNum($scope.tradeIndex, $scope.tradeNumber);
			$scope.chooseLossMoney($scope.lowIndex, $scope.lowMoney);
			if (!$scope.userInfo['named']) {
				initValidate();
			} else {
				//向本地条件添加合约号
				showNewContractNo($scope.contractNo);
			}
		} else {
			if (userInfoData.code != 100) {
				X.tip(userInfoData['resultMsg']);
			} else if (riskData.code != 100) {
				X.tip(riskData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//发起交易
	$scope.toTrade = function () {
		var needMoney = $scope.principal + $scope.serviceMoney,
			tradeT = SystemService.beyondTradeTimeTips($scope.commodityNo);
		//如果使用红包抵扣，从所需余额中减去红包部分
		if ($scope.useTip) {
			needMoney -= $scope.usTipBalance;
		}

		if (!isTrade) {
			X.dialog.alert('暂停交易');
			return false;
		}

		//判断是否交割期间
		if ($scope.futureInfo.contractNo != $scope.contractNo) {
			X.dialog.alert('合约交割变更期间，无法发起策略');
			return false;
		}

		//判断是否是在交易时间段内
		var isInPeriod = SystemService.isInPeriod($scope.commodityNo, 'trade');
		if (!isInPeriod) {
			X.dialog.alert(tradeT);
			return false;
		}

		if ($scope.type != '1') {
			//判断余额是否充足
			if ($scope.balance < needMoney) {//余额不足
				X.dialog.confirm('当前余额不足，<br>请充值后再发起策略。', {
					sureBtn: '去充值', notify: function (nt) {
						if (nt == 1) {
							$scope.$apply(function () {
								$location.url('/payType?backURL=/outerTradeBuy/' + $scope.commodityNo + '/' + $scope.type + '/' + $scope.buyChange);
							})
						}
					}
				});
				return false;
			}
			//判断是否有签署协议
			if (!$scope.signAgreement) {
				$location.url('/outerAgreementSigned/' + $scope.commodityNo + '?backURL=/outerTradeBuy/' + $scope.commodityNo + '/' + $scope.type + '/' + $scope.buyChange);
				return false;
			}
		}

		trade();
	};

	//选择手数
	$scope.chooseTradeNum = function (index, number) {
		$scope.tradeIndex = index;
		$scope.tradeNumber = number;
		$scope.selectedCount = index;
		getLossMoney(number);
		getPrincipal();
	};

	//选择止损金额
	$scope.chooseLossMoney = function (index, money) {
		$scope.lowIndex = index;
		$scope.lowMoney = money;
		$scope.selectedLowMoney = index;
		getPrincipal();
	};

	//展开止损列表
	$scope.showLoss = function () {
		$scope.showLossMoney = !$scope.showLossMoney;
	};

	//展开交易数量列表
	$scope.showCount = function () {
		$scope.showCountNum = !$scope.showCountNum;
	};

	//初始化风控接口数据
	function init(data) {
		$scope.balance = data['balance'];
		$scope.signAgreement = data['signAgreement'];
		$scope.token = data['token'];
		var newTime = data['nowTime'];
		var risk = JSON.parse(data['strRisk']);
		var tradeTimeStr = risk['tradingTimeLimit'].value;//交易时间
		//获取每个具体时间
		$scope.commodityTitle = risk['futuresName'].value;//商品名称 美黄金
		$scope.contractNo = risk['contractCode'].value;//合约代码编号 CL1606
		$scope.tradeNumList = risk['number'].value.split(','); //手数 1,2,3,4,5
		$scope.tradeNumber = $scope.tradeNumList[0];
		$scope.serviceCharge = risk['serviceCharge'].value;//服务费
		$scope.value = risk['contractValue'].value; //最小波动价值
		$scope.profitMultiple = risk['quitGainValue'].value; //止盈线倍数 5
		var lossCount = risk['quitCloseRatio'].value.split(',');//止损线点数 20,40,60,80,100
		$scope.lossCountLen = [];
		for (var i = 0; i < lossCount.length; i++) {
			$scope.lossCountLen.push(X.toInt(lossCount[i]));
		}
		$scope.lossScale = risk['lossRatio'].value;  // 止损比例
		$scope.exchangeRate = risk['exchangeRate'].value; // 汇率

		//存在参数时
		if (amount && quitCloseRatio) {
			if ($scope.tradeNumList.indexOf(amount) != -1 && lossCount.indexOf(quitCloseRatio) != -1) {
				$scope.tradeIndex = $scope.tradeNumList.indexOf(amount);
				$scope.tradeNumber = amount;
				$scope.lowIndex = lossCount.indexOf(quitCloseRatio);
			}
		}

		var holiday = SystemService.parseHoliday(risk['holiday'].value);
		var tradeTime = SystemService.parsePeriod(tradeTimeStr);
		var quoteTime = SystemService.parsePeriod(risk['quoteTime'].value);
		isTrade = risk['isTrade'].value == '1';
		SystemService.setCurrentTime(newTime);
		SystemService.setCurrentCurrencyType('USD');
		SystemService.setHoliday(holiday);
		SystemService.setTradePeriod(tradeTime);
		SystemService.setQuotePeriod(quoteTime, $scope.commodityNo);
		/*$scope.tradeTime = tradeTime;//将service处理好的交易时间数组放入$scope.tradeTime，不用再处理一遍*/

		getFutures(true);
		X.engine.addTask(getFutures, 500);
		X.engine.start();
	}

	//进行实名判断
	function initValidate() {
		if ($scope.type != '1') {
			//判断是否进行实名认证
			X.dialog.confirm('您还未实名认证，请先实名认证', {
				notify: function (nt) {
					if (nt == 1) {
						$location.url('/identification?backURL=/outerTradeBuy/' + $scope.commodityNo + '/' + $scope.type + '/' + $scope.buyChange);
					}
					if (nt == 0) {
						$location.url('/outerTrade/' + $scope.commodityNo + '/' + $scope.type);
					}
				}
			});
		}
	}

	//提示合约更新
	function showNewContractNo(contractNo) {
		var storage = window.localStorage, CONTRACTNO = 'CONTRACTNO', contractNoStr = storage.getItem(CONTRACTNO) || '';
		if (contractNoStr == '') {
			X.dialog.alert($scope.commodityTitle + '合约已更新为' + contractNo);
			storage.setItem(CONTRACTNO, contractNo);
			return;
		}
		var conTractNoArr = contractNoStr.split(',');
		if (conTractNoArr.indexOf(contractNo) == -1) {
			X.dialog.alert($scope.commodityTitle + '合约已更新为' + contractNo);
			conTractNoArr.push(contractNo);
			storage.setItem(CONTRACTNO, conTractNoArr);
		}
	}

	//判断时间
	function getFutures(flag) {
		//判断是否是在交易时间段内
		if (isTrade) {
			$scope.isInPeriod = SystemService.isInPeriod($scope.commodityNo, 'trade');
			if ($scope.isInPeriod) {
				$scope.tips = SystemService.getTipsForTradeStopTime($scope.commodityNo);
			} else {
				$scope.tips = SystemService.getTipsForNextTime($scope.commodityNo);
			}
		} else {
			$scope.isInPeriod = false;
			$scope.tips = '暂停交易';
		}

		var isInQuoteTime = SystemService.isInPeriod($scope.commodityNo, 'quote');
		if (!flag && !isInQuoteTime) {
			$scope.$apply();
		}
		//判断是否是在行情时间段内
		if (isLoadFuturesQuote && isInQuoteTime) {
			isLoadFuturesQuote = false;
			StockService.getFuturesQuote($scope.commodityNo).then(function (res) {
				isLoadFuturesQuote = true;
				var data = res.data;
				if (data.code == 100) {
					futureQuote(data.data);
				} else {
					X.tip(data['resultMsg']);
				}
				X.loading.hide();
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}
	}

	//初始化买卖价
	function futureQuote(data) {
		if (!data) {
			return;
		}
		var futureArr = data.split(',');
		//合约编号, 时间,开盘价,昨收,涨跌值,涨跌幅,最高,最低,总手,最新价,对手买价,对手卖价,买量,卖量
		$scope.futureInfo = {
			contractNo: futureArr[0],
			buyPrice: futureArr[10],
			sellPrice: futureArr[11]
		};
	}

	$scope.$on('$destroy', function () {
		X.engine.destroy();
	});

	//获取止损金额和交易综合费
	function getLossMoney(num) {
		//获得止损列表
		for (var i = 0; i < $scope.lossCountLen.length; i++) {
			//止损 = 手数 * 止损线点数 * 汇率 * 每个交易类型的合约价值
			$scope.lowMoneyList[i] = Math.round(num * $scope.lossCountLen[i] * $scope.exchangeRate * $scope.value * 100) / 100 | 0;
		}
		//获得具体的止损值。点击交易数量之后的切换
		$scope.lowMoney = Math.round(num * $scope.lossCountLen[$scope.lowIndex] * $scope.exchangeRate * $scope.value * 100) / 100 | 0;
		//获得服务费
		getServiceMoney(num);
	}

	//获得服务费
	function getServiceMoney(num) {
		$scope.serviceMoney = $scope.serviceCharge * num;

		//使用红包
		$scope.usTipBalance = Math.min($scope.serviceMoney, $scope.tipBalance);
	}

	//获得止盈金额和保证金
	function getPrincipal() {
		//保证金 = 手数 * 止损线点数 * 汇率 * 每个交易类型的合约价值/止损比例
		$scope.principal = Math.round($scope.tradeNumber * $scope.lossCountLen[$scope.lowIndex] * $scope.exchangeRate * $scope.value * 100) / $scope.lossScale / 100 | 0;
		//止盈 = 保证金*5
		getHighMoney();
		getPrincipalPrice();
	}

	function getHighMoney() {
		//止盈 = 手数 * 止损线点数 * 汇率 * 每个交易类型的合约价值 * 倍数/止损比例
		$scope.highMoney = Math.round($scope.tradeNumber * $scope.lossCountLen[$scope.lowIndex] * $scope.exchangeRate * $scope.value * $scope.profitMultiple * 100) / 100 | 0;
	}

	function getPrincipalPrice() {
		//兑换为外币 = 手数 * 止损线点数 * 每个交易类型的合约价值/止损比例
		$scope.getPrincipalPrice = Math.round($scope.tradeNumber * $scope.lossCountLen[$scope.lowIndex] * $scope.value * 100) / $scope.lossScale / 100 | 0;
	}

	function trade() {
		var direction = $scope.buyChange == "sell" ? "S" : "B";

		var postData = {
			commodityNo: $scope.futureInfo.contractNo,//获取行情返回的合约编号，后端判断是否交割
			type: $scope.type,
			useTip: $scope.type == '2' ? $scope.useTip : false,
			amount: $scope.tradeNumber,
			direction: direction,
			lossPrincipal: $scope.principal,
			gainPrincipal: $scope.highMoney,
			serviceCharge: $scope.serviceMoney,
			contractCode: $scope.contractNo,
			quitLoss: $scope.lowMoney,
			quitGain: $scope.highMoney,
			quitCloseRatio: $scope.lossCountLen[$scope.lowIndex],
			token: $scope.token
		};

		X.loading.show();
		TradeService.createFuturesStrategy(postData).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				replaceToken(data);
				X.dialog.alert('点买成功', {
					notify: function () {
						$location.url('/outerTradeSell/' + $scope.commodityNo + '/' + $scope.type);
					}
				});

				//埋点：交易
				if ($scope.type == '2') {
					zhuge.track('交易', {
						名称: $scope.commodityNo
					});
				}
			} else {
				replaceToken(data);
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	//当再次点击点买时，替换掉之前的token值
	function replaceToken(data) {
		var token = data.data;
		$scope.token = token.token;
	}
});

//外盘的协议签署
myControllers.controller('OuterAgreementSignedCtrl', function ($scope, $routeParams, $location, UserService) {
	$scope.commodityNo = $routeParams.commodityNo;
	var backURL = $location.search()['backURL'];
	$scope.backURL = '/index';
	if (backURL && backURL != '') {
		$scope.backURL = backURL;
	}
	$scope.commodityTitles = {
		CL: {
			name: '美原油',
			commodity: 'CL'
		},
		GC: {
			name: '美黄金',
			commodity: 'GC'
		},
		HSI: {
			name: '恒指',
			commodity: 'HSI'
		},
		MHI: {
			name: '小恒指',
			commodity: 'MHI'
		},
		SI: {
			name: '美白银',
			commodity: 'SI'
		},
		DAX: {
			name: '德指',
			commodity: 'DAX'
		},
		CN: {
			name: '富时A50',
			commodity: 'CN'
		}
	};

	$scope.singAgreement = function () {
		var agree = document.getElementById('agreement');
		if (!agree.checked) {//若被选中
			X.tip('请先同意签署相关协议');
			return false;
		}
		X.loading.show();
		UserService.outerSignAgreement($scope.commodityNo).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$location.url($scope.backURL);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};
});
//外盘协议合同
myControllers.controller('OuterAgreementCtrl', function ($scope, $location, TradeService) {
	var backURL = $location.search()['backURL'];
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}
	var id = $location.search()['id'];
	$scope.tradeInfo = null;

	$scope.back = function () {
		if (backURL && backURL != '') {
			$scope.backURL = backURL;
			return false;
		}
		$scope.backURL = window.history.back(-1);
	};

	function init() {
		if (!id)return;
		X.loading.show();
		TradeService.getStrategyInfo(id).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var dataInfo = data.data, tradeDirection;
				if (dataInfo) {
					tradeDirection = dataInfo.direction == 'B' ? '看涨' : '看跌';
					$scope.tradeInfo = {
						investorUsername: dataInfo.investorUsername,
						investorUserId: dataInfo.investorUserId,
						username: dataInfo.username,
						userId: dataInfo.userId,
						commodityName: dataInfo.commodityName,
						direction: tradeDirection,
						amount: dataInfo.amount,
						quitGain: parseInt(dataInfo.quitGain),
						quitLoss: parseInt(dataInfo.quitLoss)
					}
				}
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	init();
});
//外盘资费协议
myControllers.controller('OuterAgreementSaletorCtrl', function ($scope, $location) {
	var backURL = $location.search()['backURL'];
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}

	$scope.back = function () {
		if (backURL && backURL != '') {
			$scope.backURL = backURL;
			return false;
		}
		$scope.backURL = window.history.back(-1);
	}
});

//注册协议 DONE
myControllers.controller('AgreementRegister', function ($scope, $location) {
	$scope.backURL = $location.search()['backURL'] || '/register1';
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}
});
//资金明细 DONE
myControllers.controller('FundCtrl', function ($scope, $q, $location, PayService) {
	var pageSize = 10;
	$scope.currType = $location.search()['type'] || 'all';//当前类别
	$scope.currFund = 0;//当前选择ID
	$scope.currPage = 1;//当前页
	$scope.totalPage = 1;//总页数
	//类别列表
	$scope.fundTypeList = {
		all: {
			value: 'chargeWithdraw',
			text: '全部',
			explain: 'all'
		},
		charge: {
			value: 'chargeWithdraw',
			text: '充值',
			explain: 'income'
		},
		withdraw: {
			value: 'chargeWithdraw',
			text: '提现',
			explain: 'outcome'
		},
		income: {
			value: 'loan',
			text: '收入',
			explain: 'income'
		},
		outcome: {
			value: 'loan',
			text: '支出',
			explain: 'outcome'
		}
	};

	//数据列表
	$scope.fundList = [];

	//根据条件获取数据列表
	$scope.getFundDetailList = function (action, explain, page) {
		var isNotTypeChanged = false;
		action = action || '';
		page = page || 1;

		if (action == $scope.fundTypeList[$scope.currType].value && explain == $scope.fundTypeList[$scope.currType].explain) {
			isNotTypeChanged = true;
		}

		X.loading.show();
		if(explain=='all'){
			PayService.getFundAll(action, page, pageSize).then(function (res) {
				var data = res.data;
				if (data.code == 100) {
					var list = data.data['items'];
					$scope.currPage = data.data['pageIndex'];//当前页
					$scope.totalPage = data.data['totalPage'];//总页数
					if (isNotTypeChanged && page != 1) {
						$scope.fundList = $scope.fundList.concat(list);
					} else {
						$scope.fundList = list;
					}
				} else {
					X.tip(data['resultMsg']);
				}
				X.loading.hide();
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}else{
			PayService.getFundDetail(action, explain, page, pageSize).then(function (res) {
				var data = res.data;
				if (data.code == 100) {
					var list = data.data['items'];
					$scope.currPage = data.data['pageIndex'];//当前页
					$scope.totalPage = data.data['totalPage'];//总页数
					if (isNotTypeChanged && page != 1) {
						$scope.fundList = $scope.fundList.concat(list);
					} else {
						$scope.fundList = list;
					}
				} else {
					X.tip(data['resultMsg']);
				}
				X.loading.hide();
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}
	};

	//确认选择类别
	$scope.confirmFundType = function (currType, page) {
		page = page || 1;
		var type = $scope.fundTypeList[currType].value;
		var explain = $scope.fundTypeList[currType].explain;

		$scope.currType = currType;
		$scope.showTypeDialog = false;
		$scope.getFundDetailList(type, explain, page);
	};

	//显示当前选择的明细详情
	$scope.showCurrFundDetail = function (fundId) {
		$scope.currFund = $scope.currFund == fundId ? 0 : fundId;
	};

	//取消提现
	$scope.cancelWithdraw = function (fundId) {
		X.dialog.confirm('取消提现后金额自动退还到账户余额', {
			notify: function (nt) {
				if (nt == 1) {
					/*$scope.$apply(function () {
					 cancel(fundId);
					 });*/
					cancel(fundId);
				}
			}
		})
	};

	function cancel(id) {
		X.loading.show();
		PayService.cancelWithdraw(id).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var withDraw = $scope.fundTypeList['withdraw'];
				$scope.getFundDetailList(withDraw['value'], withDraw['explain']);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	//初始化加载数据列表
	$scope.confirmFundType($scope.currType, $scope.currPage);
});
//充值方式 DONE
myControllers.controller('PayTypeCtrl', function ($scope, $q, $location) {
	$scope.backURL = $location.search()['backURL'] || '/myHome';
});
//充值银行卡 DONE
myControllers.controller('PayBankCtrl', function ($scope, $q, $location, UserService, PayService) {
	var payForm = document.getElementById('payForm');
	$scope.backURL = $location.search()['backURL'] || '/fund';
	$scope.balance = 0;
	$scope.userInfo = {};
	$scope.money = '';//充值金额

	X.loading.show();
	$q.all({
		userInfo: UserService.getUserInfo(),
		balance: UserService.getBalance()
	}).then(function (res) {
		var userInfoData = res.userInfo.data;
		var balanceData = res.balance.data;

		if (userInfoData.code == 100 && balanceData.code == 100) {
			$scope.balance = balanceData.data.balance;
			$scope.userInfo = userInfoData.data;
			if (!$scope.userInfo.named) {
				toIdenty();
			} else {
				$scope.userInfo.maskName = X.maskName($scope.userInfo.name);
			}
		} else {
			if (userInfoData.code != 100) {
				X.tip(userInfoData['resultMsg']);
			} else if (balanceData.code != 100) {
				X.tip(balanceData['resultMsg']);
			}
		}
		payForm.removeAttribute('action');
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//跳转到联动的接口
	$scope.pay = function () {
		if (!$scope.userInfo.named) {
			toIdenty();
			return;
		}
		// if ($scope.bankCode == '') {
		//     X.tip('请选择充值银行');
		//     return;
		// }
		// if ($scope.cardNo == '') {
		//     X.tip('请输入银行卡号');
		//     return;
		// }
		// if (!X.isBankCard($scope.cardNo)) {
		//     X.tip('银行卡号不符合规范');
		//     return;
		// }
		if ($scope.money == '') {
			X.tip('请输入充值金额');
			return;
		}

		if (!X.isMoney($scope.money, true)) {
			X.tip('充值金额输入错误');
			return;
		}

		//最低100元，测试后添加
		// if ($scope.money < 100) {
		//     X.tip('最低100元起充');
		//     return;
		// }

		if ($scope.money > 5000) {
			X.tip('单次充值最高5000元');
			return;
		}

		X.loading.show();
		PayService.payGateway($scope.money).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				pay(data.data);
				zhuge.track("充值", {
					充值金额: $scope.money
				});
			} else {
				X.tip(data['resultMsg']);
				X.loading.hide();
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};


	function pay(payURL) {
		payForm.setAttribute('action', payURL);
		payForm.submit();
	}

	// function payConfirm() {
	//     X.dialog.confirm('充值是否成功', {
	//         sureBtn: '充值成功', cancelBtn: '充值失败', notify: function (nt) {
	//             if (nt == 1) {
	//                 $scope.$apply(function () {
	//                     $location.url($scope.backURL);
	//                 });
	//             }
	//         }
	//     })
	// }

	function toIdenty() {
		X.dialog.confirm('您还未实名认证，请先实名认证', {
			notify: function (nt) {
				if (nt == 1) {
					$scope.$apply(function () {
						$location.url('/identification?backURL=/payBank');
					});
				}
				if (nt == 0) {
					$scope.$apply(function () {
						$location.url('/payType');
					});
				}
			}
		});
	}

	// $scope.$watch('money', function (newValue) {
	//     var money = X.toFloat(newValue) || 0;
	//     if (money > 50000) {
	//         $scope.money = money = 50000;
	//     }
	//     $scope.charge = Math.ceil(money * 7 / 10.0) / 100.0;
	// });
});
//充值短信验证 DONE
myControllers.controller('PayMobileCtrl', function ($scope, $q, UserService, PasswordService) {
	// $scope.time = 0;
	// $scope.mobile = '' || 13588860745;//手机号
	// $scope.bankCard = [];
	//
	// X.loading.show();
	// $q.all({
	//     bankCard: UserService.getBankCardInfo()
	// }).then(function (res) {
	//     var bankCardInfo = res.bankCard.data;
	//     if (bankCardInfo.code == 100) {
	//         $scope.bankCard = bankCardInfo.data;
	//         //银行的图标未进行更改
	//     } else {
	//         X.tip(bankCardInfo['resultMsg']);
	//     }
	//     X.loading.hide();
	// }).catch(function () {
	//     X.tip('服务器请求异常');
	// });
	//
	// //验证手机号和验证码是否符合要求
	// $scope.check = function () {
	//     var myReg = /^((13[0-9])|(14[5|7])|(15([0-3]|[5-9]))|(17[0-1,6-8])|(18[0,2,3,5-9]))\d{8}$/;
	//     if ($scope.mobile == '' || !myReg.test($scope.mobile)) {
	//         X.tip('手机号输入有误！');
	//         return false;
	//     }
	//     if ($scope.checkCode.length < 4) {
	//         X.tip('请输入4位验证码！');
	//         return false;
	//     }
	// };
	//
	// //判断手机号是否为银行预留手机号
	// $scope.getCheckCode = function () {
	//     var myReg = /^((13[0-9])|(14[5|7])|(15([0-3]|[5-9]))|(17[0-1,6-8])|(18[0,2,3,5-9]))\d{8}$/;
	//     if (!myReg.test($scope.mobile)) {
	//         X.tip('请输入正确的手机号码');
	//         return false;
	//     }
	//     //发送验证码请求
	//     X.loading.show();
	//     PasswordService.sendForgetCode($scope.mobile).then(function (res) {
	//         var data = res.data;
	//         if (data.code == 100) {
	//             $scope.time = 60;
	//             timerFn();
	//         } else if (data.code == 101) {
	//             $scope.time = data.data.interval;
	//             timerFn();
	//         } else {
	//             X.tip(data['resultMsg']);
	//         }
	//         X.loading.hide();
	//     }).catch(function () {
	//         X.tip('服务器请求异常');
	//     });
	// };
	//
	// //设置定时器
	// var timer;
	//
	// function timerFn() {
	//     timer = setInterval(function () {
	//         if ($scope.time > 0) {
	//             $scope.$apply(function () {
	//                 $scope.time--;
	//             });
	//         } else {
	//             timer && clearTimeout(timer);
	//         }
	//     }, 1000);
	// }
	//
	// //卸载页面的定时器
	// $scope.$on('$destroy', function () {
	//     timer && clearTimeout(timer);
	// });
});
//充值成功
myControllers.controller('PaySuccessCtrl', function ($scope, $location) {
	var code = $location.search()['code'] || 505, money = $location.search()['money'] || 0;
	$scope.code = code;
	// $scope.money = money;

	//埋点：充值
	if (code == 100 && money != 0) {
		zhuge.track('充值', {
			充值金额: money
		});
	}
});
//提现 DONE
myControllers.controller('WithdrawCtrl', function ($scope, $q, $location, UserService, PayService) {
	$scope.money = '';
	$scope.cardId = '';
	$scope.password = '';
	$scope.bankCardList = [];
	$scope.selectBankCard = null;
	$scope.balance = 0;
	$scope.user = {};
	$scope.userName = '';
	$scope.showDialog = false;

	X.loading.show();
	$q.all({
		balance: UserService.getBalance(),
		bankCards: UserService.getBankCards(),
		userInfo: UserService.getUserInfo()
	}).then(function (res) {
		var balanceData = res.balance.data;
		var bankCardData = res.bankCards.data;
		var userInfoData = res.userInfo.data;

		if (balanceData.code == 100 && bankCardData.code == 100 && userInfoData.code == 100) {
			$scope.bankCardList = bankCardData.data;
			$scope.balance = balanceData.data['balance'];
			$scope.user = userInfoData.data;
			initDefaultBankCard();
			initValidate();
		} else {
			if (balanceData.code != 100) {
				X.tip(balanceData['resultMsg']);
			} else if (bankCardData.code != 100) {
				X.tip(bankCardData['resultMsg']);
			} else if (userInfoData.code != 100) {
				X.tip(userInfoData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//确认选择银行卡
	$scope.sureChoose = function (index) {
		$scope.selectBankCard = $scope.bankCardList[index];
		$scope.showDialog = false;
	};

	//初始化默认卡
	function initDefaultBankCard() {
		if (!$scope.bankCardList.length) {
			$scope.selectBankCard = null;
			return;
		}
		$scope.selectBankCard = $scope.bankCardList[0];
		var i, bank;
		for (i = 0; i < $scope.bankCardList.length; i++) {
			bank = $scope.bankCardList[i];
			if (bank['defaultCard'] == 0) {
				$scope.selectBankCard = bank;
				break;
			}
		}
	}

	//校验信息是否合法
	function initValidate() {
		if (!$scope.user.named) {
			X.dialog.confirm('您还未实名认证，请先实名认证', {
				notify: function (nt) {
					if (nt == 1) {
						bootTurn('/identification?backURL=/withdraw');
					}
					if (nt == 0) {
						bootTurn('/myHome');
					}
				}
			});
			return;
		}

		if ($scope.balance.balance == 0) {
			X.dialog.alert('您的账户没有可提金额', {
				notify: function () {
					bootTurn('/myHome');
				}
			});
			return;
		}

		if (!$scope.bankCardList.length) {
			X.dialog.confirm('提款前请先添加提款银行卡', {
				notify: function (nt) {
					if (nt == 1) {
						bootTurn('/addBankCard?backURL=/withdraw');
					}
					if (nt == 0) {
						bootTurn('/myHome');
					}
				}
			});
			return;
		}

		if ($scope.user.withdrawPw == '') {
			X.dialog.confirm('您还未设置提现密码', {
				notify: function (nt) {
					if (nt == 1) {
						bootTurn('/tradePassSet?backURL=/withdraw');
					}
					if (nt == 0) {
						bootTurn('/myHome');
					}
				}
			});
			return;
		}

		if ($scope.selectBankCard == null || $scope.selectBankCard.province == '*' || $scope.selectBankCard.city == '*' || $scope.selectBankCard['subbranch'] == '*') {
			X.dialog.confirm('所选提款银行卡信息不完善<br>请先完善该银行卡信息', {
				notify: function (nt) {
					if (nt == 1) {
						bootTurn('/bankInfo?backURL=/withdraw');
					}
					if (nt == 0) {
						bootTurn('/myHome');
					}
				}
			});
		}
	}

	//引导跳转
	function bootTurn(url) {
		$scope.$apply(function () {
			$location.url(url);
		});
	}

	//判断提现金额和提现密码的正确性
	$scope.checkMoney = function () {
		if ($scope.money == '') {
			X.tip('请输入提现金额');
			return false;
		}
		if (!X.isMoney($scope.money)) {
			X.tip('金额输入错误');
			return false;
		}
		if ($scope.money < 100) {
			X.tip('提现金额最低100元起提');
			return false;
		}
		if ($scope.money > $scope.balance) {
			X.tip('提现金额超出您的余额');
			return false;
		}
		if ($scope.password == '') {
			X.tip('提现密码不为空！');
			return false;
		}
		if (!/^\d{6}$/.test($scope.password)) {
			X.tip('提现密码为6位数字');
			return false;
		}
		if ($scope.selectBankCard == null) {
			X.tip('未找到您的提现银行卡信息');
			return false;
		}
		X.loading.show();
		PayService.doWithdraw($scope.selectBankCard.id, $scope.money, $scope.password).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('提现发起成功，等待处理中');
				$location.url('/fund?type=withdraw');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};
});
//添加银行卡
myControllers.controller('AddBankCardCtrl', function ($scope, $q, $location, UserService, PayService, SystemService) {
	var province = SystemService.getProvince();
	var cities = SystemService.getCities();
	$scope.backURL = $location.search()['backURL'] || '/bankCardList';
	$scope.bankList = {};
	$scope.user = {};
	$scope.showBankList = false;
	$scope.userName = '';
	$scope.bankCode = '';
	$scope.bankName = '请选择银行';
	$scope.showDialog = false;
	$scope.list = []; //保存省市支行的数组，通用数组
	$scope.provinceId = '';
	$scope.province = '请选择省';
	$scope.city = '请选择市';
	$scope.branch = '请选择开户支行';
	$scope.bankCard = '';
	$scope.sureBankCard = '';

	X.loading.show();
	$q.all({
		bankList: UserService.getBankInfo(),
		userInfo: UserService.getUserInfo()
	}).then(function (res) {
		var bankListData = res.bankList.data;
		var userData = res.userInfo.data;
		if (bankListData.code == 100 && userData.code == 100) {
			$scope.user = userData.data;
			$scope.userName = X.maskName($scope.user.name);
			parseBankList(bankListData.data);
			initValidate();
		} else {
			if (bankListData.code != 100) {
				X.tip(bankListData['resultMsg']);
			} else if (userData.code != 100) {
				X.tip(userData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//选择银行
	$scope.sureChooseBank = function (bankCode) {
		$scope.showBankList = false;
		$scope.bankCode = bankCode;
		$scope.bankName = $scope.bankList[bankCode].bankName;
		$scope.provinceId = '';
		$scope.province = '请选择省';
		$scope.city = '请选择市';
		$scope.branch = '请选择开户支行';
	};

	//选择省份
	$scope.chooseProvice = function () {
		$scope.title = '开户省份';
		$scope.list = [];
		if ($scope.bankName == '' || $scope.bankName == '请选择银行') {
			X.tip('请选择银行');
			return;
		}
		var i, len = province.length;
		for (i = 0; i < len; i++) {
			$scope.list.push(province[i]);
		}
		$scope.showDialog = true;
	};

	//选择城市
	$scope.chooseCity = function () {
		$scope.title = '开户城市';
		$scope.list = [];
		if ($scope.bankName == '' || $scope.bankName == '请选择银行') {
			X.tip('请选择银行');
			return;
		}
		if ($scope.province == '' || $scope.province == '请选择省' || $scope.provinceId == '') {
			X.tip('请选择开户省份');
			return;
		}
		var i, len = cities.length, city;
		for (i = 0; i < len; i++) {
			city = cities[i];
			if (city[0] == $scope.provinceId) {
				$scope.list.push([city[1], city[2]]);
			}
		}
		$scope.showDialog = true;
	};

	//选择支行
	$scope.chooseBranch = function () {
		$scope.title = '开户支行';
		$scope.list = [];
		if ($scope.bankName == '' || $scope.bankName == '请选择银行') {
			X.tip('请选择银行');
			return;
		}
		if ($scope.province == '' || $scope.province == '请选择省') {
			X.tip('请选择开户省份');
			return;
		}
		if ($scope.city == '' || $scope.city == '请选择市') {
			X.tip('请选择开户城市');
			return;
		}
		$scope.showDialog = true;
		X.loading.show();
		UserService.getSubBank($scope.bankName, $scope.province, $scope.city).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var banks = data.data, i, len = banks.length;
				for (i = 0; i < len; i++) {
					$scope.list.push([0, banks[i]]);
				}
				$scope.showDialog = true;
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//确认选择省市支行信息
	$scope.sureChoose = function (title, id, name) {
		switch (title) {
			case '开户省份':
				$scope.province = name;
				$scope.provinceId = id;
				$scope.city = '请选择市';
				$scope.branch = '请选择开户支行';
				break;
			case '开户城市':
				$scope.city = name;
				$scope.branch = '请选择开户支行';
				break;
			case '开户支行':
				$scope.branch = name;
				break;
		}
		$scope.showDialog = false;
	};

	//将数据保存下来
	$scope.save = function () {
		if ($scope.bankName == '' || $scope.bankName == '请选择银行') {
			X.tip('请选择银行');
			return;
		}
		if ($scope.province == '' || $scope.province == '请选择省') {
			X.tip('请选择开户省份');
			return;
		}
		if ($scope.city == '' || $scope.city == '请选择市') {
			X.tip('请选择开户城市');
			return;
		}
		if ($scope.branch == '' || $scope.branch == '请选择开户支行') {
			X.tip('请选择开户支行');
			return;
		}
		if ($scope.bankCard == '') {
			X.tip('请输入银行卡号');
			return;
		}
		if (!X.isBankCard($scope.bankCard)) {
			X.tip('请输入正确的银行卡号');
			return;
		}
		if ($scope.sureBankCard == '') {
			X.tip('请输入确认卡号');
			return;
		}
		if ($scope.bankCard != $scope.sureBankCard) {
			X.tip('确认卡号与银行卡号不一致');
			return;
		}
		X.loading.show();
		//更新银行卡信息
		UserService.bindBankCard($scope.bankName, $scope.province, $scope.city, $scope.branch, $scope.bankCard).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('银行卡添加成功');
				//是否需要返回跳转
				$location.url($scope.backURL);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//实名认证
	function initValidate() {
		if (!$scope.user.named) {
			X.dialog.confirm('您还未实名认证，请先实名认证', {
				notify: function (nt) {
					if (nt == 1) {
						bootTurnURL('/identification?backURL=/bankCardList');
					}
					if (nt == 0) {
						bootTurnURL('/myInfo');
					}
				}
			});
		}
	}

	//跳转
	function bootTurnURL(url) {
		$scope.$apply(function () {
			$location.url(url);
		})
	}

	//组装银行列表
	function parseBankList(bankList) {
		if (!bankList || !bankList.length) return;
		bankList.forEach(function (item) {
			$scope.bankList[item.code] = item;
		});
	}

});
//修改银行卡
myControllers.controller('ModifyBankCardCtrl', function ($scope, $q, $routeParams, $location, UserService, SystemService) {
	var bankCardId = $routeParams['bankCardId'];
	var province = SystemService.getProvince();
	var cities = SystemService.getCities();
	$scope.backURL = $location.search()['backURL'] || '/bankCardList';
	$scope.bankCard = null;
	$scope.user = {};
	$scope.showDialog = false;
	$scope.list = []; //保存省市支行的数组，通用数组
	$scope.provinceId = '';
	$scope.province = '请选择省';
	$scope.city = '请选择市';
	$scope.branch = '请选择开户支行';
	$scope.sureBankCard = '';

	X.loading.show();
	$q.all({
		bankCard: UserService.getBankCardById(bankCardId),
		userInfo: UserService.getUserInfo()
	}).then(function (res) {
		var bankCardData = res.bankCard.data;
		var userData = res.userInfo.data;
		if (bankCardData.code == 100 && userData.code == 100) {
			$scope.user = userData.data;
			$scope.bankCard = bankCardData.data;
			if ($scope.user.name == '') {
				toIdenty();
			} else {
				initData();
			}
		} else {
			X.tip(bankCardData['resultMsg']);
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//选择省份
	$scope.chooseProvice = function () {
		$scope.title = '开户省份';
		$scope.list = [];
		var i, len = province.length;
		for (i = 0; i < len; i++) {
			$scope.list.push(province[i]);
		}
		$scope.showDialog = true;
	};

	//选择城市
	$scope.chooseCity = function () {
		$scope.title = '开户城市';
		$scope.list = [];
		if ($scope.province == '' || $scope.province == '请选择省' || $scope.provinceId == '') {
			X.tip('请选择开户省份');
			return;
		}
		var i, len = cities.length, city;
		for (i = 0; i < len; i++) {
			city = cities[i];
			if (city[0] == $scope.provinceId) {
				$scope.list.push([city[1], city[2]]);
			}
		}
		$scope.showDialog = true;
	};

	//选择支行
	$scope.chooseBranch = function () {
		$scope.title = '开户支行';
		$scope.list = [];
		if ($scope.province == '' || $scope.province == '请选择省') {
			X.tip('请选择开户省份');
			return;
		}
		if ($scope.city == '' || $scope.city == '请选择市') {
			X.tip('请选择开户城市');
			return;
		}
		$scope.showDialog = true;
		X.loading.show();
		UserService.getSubBank($scope.bankCard.bank, $scope.province, $scope.city).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var banks = data.data, i, len = banks.length;
				for (i = 0; i < len; i++) {
					$scope.list.push([0, banks[i]]);
				}
				$scope.showDialog = true;
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//确认选择省市支行信息
	$scope.sureChoose = function (title, id, name) {
		switch (title) {
			case '开户省份':
				$scope.province = name;
				$scope.provinceId = id;
				$scope.city = '请选择市';
				$scope.branch = '请选择开户支行';
				break;
			case '开户城市':
				$scope.city = name;
				$scope.branch = '请选择开户支行';
				break;
			case '开户支行':
				$scope.branch = name;
				break;
		}
		$scope.showDialog = false;
	};

	//将数据保存下来
	$scope.save = function () {
		if ($scope.province == '' || $scope.province == '请选择省') {
			X.tip('请选择开户省份');
			return;
		}
		if ($scope.city == '' || $scope.city == '请选择市') {
			X.tip('请选择开户城市');
			return;
		}
		if ($scope.branch == '' || $scope.branch == '请选择开户支行') {
			X.tip('请选择开户支行');
			return;
		}
		X.loading.show();
		//更新银行卡信息
		UserService.updateCardInfo($scope.bankCard.id, $scope.bankCard.bank, $scope.province, $scope.city, $scope.branch).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('银行卡信息保存成功');
				$location.url($scope.backURL);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//设置默认卡
	$scope.setDefaultBankCard = function () {
		X.loading.show();
		UserService.setDefaultBankCard(bankCardId).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('默认卡设置成功');
				$location.url('/bankCardList');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//删除卡
	$scope.deleteBankCard = function () {
		X.dialog.confirm('您确定要删除该银行卡吗？', {
			notify: function (nt) {
				if (nt == 1) {
					delBankCard();
				}
			}
		});
	};

	//删除卡
	function delBankCard() {
		X.loading.show();
		UserService.delBankCard(bankCardId).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('银行卡删除成功');
				$location.url('/bankCardList');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	function toIdenty() {
		X.dialog.confirm('您还未实名认证，请先实名认证', {
			notify: function (nt) {
				if (nt == 1) {
					bootTurnURL('/identification?backURL=/myInfo');
				}
				if (nt == 0) {
					bootTurnURL('/myInfo');
				}
			}
		});
	}

	function initData() {
		var i, len = province.length;
		for (i = 0; i < len; i++) {
			if ($scope.bankCard.province == province[i][1]) {
				$scope.provinceId = province[i][0];
				break;
			}
		}
		$scope.province = $scope.bankCard.province;
		$scope.city = $scope.bankCard.city;
		$scope.branch = $scope.bankCard.subbranch;
	}

	function bootTurnURL(url) {
		$scope.$apply(function () {
			$location.url(url);
		})
	}

});
//银行卡列表 DONE
myControllers.controller('BankCardListCtrl', function ($scope, $q, $location, UserService) {
	$scope.bankCards = [];
	$scope.user = {};

	X.loading.show();
	$q.all({
		bankCards: UserService.getBankCards(),
		userInfo: UserService.getUserInfo()
	}).then(function (res) {
		var bankCardData = res.bankCards.data;
		var userData = res.userInfo.data;
		if (bankCardData.code == 100 && userData.code == 100) {
			$scope.user = userData.data;
			$scope.bankCards = bankCardData.data;
			initValidate();
		} else {
			X.tip(bankCardData['resultMsg']);
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	function initValidate() {
		if (!$scope.user.named) {
			X.dialog.confirm('您还未实名认证，请先实名认证', {
				notify: function (nt) {
					if (nt == 1) {
						bootTurnURL('/identification?backURL=/bankCardList');
					}
					if (nt == 0) {
						bootTurnURL('/myInfo');
					}
				}
			});
		}
	}

	function bootTurnURL(url) {
		$scope.$apply(function () {
			$location.url(url);
		})
	}

});
//银行卡详情 DONE
myControllers.controller('BankInfoCtrl', function ($scope, $q, $location, UserService, SystemService) {
	$scope.backURL = $location.search()['backURL'] || '/myInfo';
	$scope.bank = {};
	$scope.user = {};
	$scope.userName = '';
	$scope.provinceId = '';
	$scope.province = '未设置';
	$scope.city = '未设置';
	$scope.branch = '未设置';
	$scope.showDialog = false;

	//设置省市
	var province = SystemService.getProvince();
	var cities = SystemService.getCities();

	X.loading.show();
	$q.all({
		bankCardInfo: UserService.getBankCardInfo(),
		userInfo: UserService.getUserInfo()
	}).then(function (res) {
		var bankCardData = res.bankCardInfo.data;
		var userData = res.userInfo.data;
		if (bankCardData.code == 100 && userData.code == 100) {
			$scope.user = userData.data;
			$scope.bank = bankCardData.data;
			initValidate();
		} else {
			X.tip(bankCardData['resultMsg']);
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	function initValidate() {
		if (!$scope.user.named) {
			X.dialog.confirm('您还未实名认证，请先实名认证', {
				notify: function (nt) {
					if (nt == 1) {
						bootTurnURL('/identification?backURL=/bankInfo');
					}
					if (nt == 0) {
						bootTurnURL('/myInfo');
					}
				}
			});
			return;
		} else {
			$scope.user.maskName = X.maskName($scope.user.name);
		}

		if ($scope.bank == null) {
			X.dialog.alert('未找到您的银行卡信息', {
				notify: function () {
					bootTurnURL('/myHome');
				}
			});
			return;
		}
		$scope.province = $scope.bank.province == '*' ? '未设置' : $scope.bank.province;
		$scope.city = $scope.bank.city == '*' ? '未设置' : $scope.bank.city;
		$scope.branch = $scope.bank['subbranch'] == '*' ? '未设置' : $scope.bank['subbranch'];
	}

	function bootTurnURL(url) {
		$scope.$apply(function () {
			$location.url(url);
		})
	}

	//遮罩层
	$scope.closeDialog = function () {
		$scope.showDialog = false;
	};

	//选择省份
	$scope.chooseProvice = function () {
		$scope.title = '开户省份';
		$scope.list = [];
		var i, len = province.length;
		for (i = 0; i < len; i++) {
			$scope.list.push(province[i]);
		}
		$scope.showDialog = true;
	};

	//选择城市
	$scope.chooseCity = function () {
		$scope.title = '开户城市';
		$scope.list = [];
		if ($scope.province == '' || $scope.province == '未设置' || $scope.provinceId == '') {
			X.tip('请选择开户省份');
			return;
		}
		var i, len = cities.length, city;
		for (i = 0; i < len; i++) {
			city = cities[i];
			if (city[0] == $scope.provinceId) {
				$scope.list.push([city[1], city[2]]);
			}
		}
		$scope.showDialog = true;
	};

	//选择支行
	$scope.chooseBranch = function () {
		$scope.title = '开户支行';
		$scope.list = [];
		if ($scope.province == '' || $scope.province == '未设置') {
			X.tip('请选择开户省份');
			return;
		}
		if ($scope.city == '' || $scope.city == '未设置') {
			X.tip('请选择开户城市');
			return;
		}
		$scope.showDialog = true;
		X.loading.show();
		UserService.getSubBank($scope.bank.bank, $scope.province, $scope.city).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var banks = data.data, i, len = banks.length;
				for (i = 0; i < len; i++) {
					$scope.list.push([0, banks[i]]);
				}
				$scope.showDialog = true;
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	$scope.sureChoose = function (title, id, name) {
		switch (title) {
			case '开户省份':
				$scope.province = name;
				$scope.provinceId = id;
				$scope.city = '未设置';
				$scope.branch = '未设置';
				break;
			case '开户城市':
				$scope.city = name;
				$scope.branch = '未设置';
				break;
			case '开户支行':
				$scope.branch = name;
				break;
		}
		$scope.showDialog = false;
	};

	//将数据保存下来
	$scope.save = function () {
		if ($scope.province == '' || $scope.province == '未设置') {
			X.tip('请选择开户省份');
			return;
		}
		if ($scope.city == '' || $scope.city == '未设置') {
			X.tip('请选择开户城市');
			return;
		}
		if ($scope.branch == '' || $scope.branch == '未设置') {
			X.tip('请选择开户支行');
			return;
		}
		X.loading.show();
		//更新银行卡信息
		UserService.updateCardInfo($scope.bank.bank, $scope.province, $scope.city, $scope.branch, $scope.bank.id).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('信息保存成功');
				//是否需要返回跳转
				$location.url($scope.backURL);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}
});

//支付宝充值页面
myControllers.controller('AlipayCtrl', function ($scope, $q, $location, UserService, PayService,SystemService) {
	$scope.account = '';
	$scope.money = '';
	$scope.balance = 0;
	$scope.user = {};
	$scope.name = '';
	$scope.param ={};


	X.loading.show();
	$q.all({
		balance: UserService.getBalance(),
		userInfo: UserService.getUserInfo()
	}).then(function (res) {
		var balance = res.balance.data;
		var userData = res.userInfo.data;
		X.clipboard.init('str');
		if (balance.code == 100 && userData.code == 100) {
			$scope.balance = balance.data;
			$scope.user = userData.data;
			$scope.param.account = userData.data.alipayAccount;
			$scope.cellPhone = SystemService.cellPhoneNumber();
			if ($scope.user['name'] == '') {
				toIdenty();
			} else {
				$scope.name = X.maskName($scope.user['name']);
			}
		} else {
			if (balance.code != 100) {
				X.tip(balance['resultMsg']);
			} else if (userData.code != 100) {
				X.tip(userData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	$scope.edit= function(){
		X.dialog.alert('如需要更换或解绑支付宝账号，请 <br>联系客服电话 <a class="txt-blue" href=' + $scope.cellPhone.cellPhoneATag + '>' + $scope.cellPhone.cellPhone + '</a>');
	}

	$scope.pay = function () {
		var account= $scope.param.account?$scope.param.account:$scope.user.alipayAccount;
		if (!account && !$scope.param.account) {
			X.tip('请输入支付宝账号');
			return;
		}
		//支付宝账号长度大于5，与6006类似
		if ($scope.param.account.length < 5) {
			X.tip('支付宝账号输入错误');
			return;
		}
		if ($scope.param.money == '' || !$scope.param.money) {
			X.tip('请输入充值金额');
			return;
		}
		if (!X.isMoney($scope.param.money, true)) {
			X.tip('充值金额输入错误');
			return;
		}
		//充值金额大于等于1元，上限10万   -------------- 测试后加上去
		if ($scope.param.money < 1) {
			X.tip('充值金额最低1元');
			return;
		}
		if ($scope.param.money > 100000) {
			X.tip('充值金额最高10万元');
			return;
		}

		X.loading.show();
		PayService.alipay($scope.param.money, $scope.param.account).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				window.location.href = '/app/goAli.html';
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//实名认证
	function toIdenty() {
		X.dialog.confirm('您还未实名认证，请先实名认证', {
			notify: function (nt) {
				if (nt == 1) {
					$scope.$apply(function () {
						$location.url('/identification?backURL=/alipay');
					});
				}
				if (nt == 0) {
					$scope.$apply(function () {
						$location.url('/payType');
					});
				}
			}
		});
	}
});
//支付宝充值二级页面
myControllers.controller('AlipayDetailCtrl', function () {
	X.clipboard.init();
});

//新手引导 DONE
myControllers.controller('GuideCtrl', function ($scope, $location) {
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}
});
//文章
myControllers.controller('ArticleCtrl', function ($scope, $location) {
	$scope.showHeader = true;
	var source = $location.search()['source'], btnName = $location.search()['btnName'] || '',
		btnLink = $location.search()['btnLink'] || '';
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}

	if (btnName) {
		$scope.btnName = decodeURIComponent(btnName);
		$scope.btnLink = decodeURIComponent(btnLink);
	}

});
//安全保证 DONE
myControllers.controller('SafeCtrl', function ($scope, $location) {
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}
});
//关于我们 DONE
myControllers.controller('AboutUsCtrl', function ($scope, $location) {
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}
});
//一分钟介绍
myControllers.controller('IntroduceCtrl', function ($scope, $location) {
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}

	$scope.toTrade = function () {
		if ($scope.showHeader) {
			$location.path('/outerTrade/HSI/2');
		} else {
			/*window.location = 'jumpCenter::suggestion';*/
			window.location.href = 'clb://clb.yztz.cn/trade?type=1&real=false&kind=gc';
		}
	};
});
//外盘的交易规则
myControllers.controller('OuterTradeRuleCtrl', function ($scope, $location) {
	$scope.backURL = $location.search()['backURL'] || '/guide';
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}
});
//外盘-持仓
myControllers.controller('OuterTradeSellCtrl', function ($scope, $q, $routeParams, $location, TradeService, SystemService, StockService) {
	$scope.commodityNo = $routeParams.commodityNo || "CL";
	$scope.type = $routeParams.type || "2";
	if ($scope.type != "1") {
		$scope.type = "2";
	}
	//头部下拉菜单
	$scope.commodityTitles = {
		MHI: '小恒指',
		HSI: '恒指',
		GC: '美黄金',
		SI: '美白银',
		CL: '美原油',
		CN: '富时A50',
		DAX: '德指'
	};
	$scope.futureInfo = {
		commodityTitle: $scope.commodityTitles[$scope.commodityNo]
	};

	// 行情相关信息       当前策略                    当前买价
	var options = {}, currentSaleFutures = [], currentPrices = {};
	//初始化弹窗ID
	$scope.currCommoID = 0;
	$scope.sellOutID = 0;
	$scope.sellAllID = 0;
	var HSIRiskData = {}, CLRiskData = {}, GCRiskData = {}, SIRiskData = {}, CNRiskData = {}, DAXRiskData = {},
		MHIRiskData = {};
	var willSaleTradeID;//要卖出的方案ID
	var sellCommoNo;//当前策略号（后面反手有用）
	$scope.saleList = [];    //策略列表
	$scope.total = 0;    //总盈亏
	$q.all({//分别获取到恒指、美原油、美黄金的风控数据
		HSIRisk: TradeService.getRisk('HSI'),
		CLRisk: TradeService.getRisk('CL'),
		GCRisk: TradeService.getRisk('GC'),
		SIRisk: TradeService.getRisk('SI'),
		CNRisk: TradeService.getRisk('CN'),
		DAXRisk: TradeService.getRisk('DAX'),
		MHIRisk: TradeService.getRisk('MHI')
	}).then(function (res) {
		HSIRiskData = res.HSIRisk.data;
		CLRiskData = res.CLRisk.data;
		GCRiskData = res.GCRisk.data;
		SIRiskData = res.SIRisk.data;
		CNRiskData = res.CNRisk.data;
		DAXRiskData = res.DAXRisk.data;
		MHIRiskData = res.MHIRisk.data
		if (HSIRiskData.code == 100 && CLRiskData.code == 100 && GCRiskData.code == 100 && SIRiskData.code == 100 && CNRiskData.code == 100 && DAXRiskData.code == 100 && MHIRiskData.code == 100) {
			init(HSIRiskData.data['strRisk'], CLRiskData.data['strRisk'], GCRiskData.data['strRisk'], SIRiskData.data['strRisk'], CNRiskData.data['strRisk'], DAXRiskData.data['strRisk'], MHIRiskData.data['strRisk']);//分别取到strRisk的数据并转换JSON为js对象
		} else {
			X.tip('系统错误');
		}
	}).catch(function () {
		X.tip('服务器请求异常');
	});


	//初始化配置参数数据，开启定时任务
	function init(HSIRisk, CLRisk, GCRisk, SIRisk, CNRisk, DAXRisk, MHIRisk) {
		var hsiRisk = JSON.parse(HSIRisk);
		var clRisk = JSON.parse(CLRisk);
		var gcRisk = JSON.parse(GCRisk);
		var siRisk = JSON.parse(SIRisk);
		var cnRisk = JSON.parse(CNRisk);
		var daxRisk = JSON.parse(DAXRisk);
		var mhiRisk = JSON.parse(MHIRisk);
		var HSICommNo = getCommNo(hsiRisk['contractCode'].value);
		var CLCommNo = getCommNo(clRisk['contractCode'].value);
		var GCCommNo = getCommNo(gcRisk['contractCode'].value);
		var SICommNo = getCommNo(siRisk['contractCode'].value);
		var CNCommNo = getCommNo(cnRisk['contractCode'].value);
		var DAXCommNo = getCommNo(daxRisk['contractCode'].value);
		var MHICommNo = getCommNo(mhiRisk['contractCode'].value);

		options[HSICommNo] = {
			symbol: 'HK$',
			commodityNo: HSICommNo,
			contractValue: X.toFloat(hsiRisk['contractValue'].value),
			exchangeRate: X.toFloat(hsiRisk['exchangeRate'].value),
			fluctuationValue: X.toFloat(hsiRisk['fluctuationValue'].value),
			isTrade: hsiRisk['isTrade'].value
		};
		options[CLCommNo] = {
			symbol: '$',//货币标示符
			commodityNo: CLCommNo,//策略号
			contractValue: X.toFloat(clRisk['contractValue'].value),//波动单价
			exchangeRate: X.toFloat(clRisk['exchangeRate'].value),//汇率
			fluctuationValue: X.toFloat(clRisk['fluctuationValue'].value),//最小波动点数
			isTrade: clRisk['isTrade'].value
		};
		options[GCCommNo] = {
			symbol: '$',
			commodityNo: GCCommNo,
			contractValue: X.toFloat(gcRisk['contractValue'].value),
			exchangeRate: X.toFloat(gcRisk['exchangeRate'].value),
			fluctuationValue: X.toFloat(gcRisk['fluctuationValue'].value),
			isTrade: gcRisk['isTrade'].value
		};
		options[SICommNo] = {
			symbol: '$',
			commodityNo: SICommNo,
			contractValue: X.toFloat(siRisk['contractValue'].value),
			exchangeRate: X.toFloat(siRisk['exchangeRate'].value),
			fluctuationValue: X.toFloat(siRisk['fluctuationValue'].value),
			isTrade: siRisk['isTrade'].value
		};
		options[CNCommNo] = {
			symbol: '$',
			commodityNo: CNCommNo,
			contractValue: X.toFloat(cnRisk['contractValue'].value),
			exchangeRate: X.toFloat(cnRisk['exchangeRate'].value),
			fluctuationValue: X.toFloat(cnRisk['fluctuationValue'].value),
			isTrade: cnRisk['isTrade'].value
		};
		options[DAXCommNo] = {
			symbol: '€',
			commodityNo: DAXCommNo,
			contractValue: X.toFloat(daxRisk['contractValue'].value),
			exchangeRate: X.toFloat(daxRisk['exchangeRate'].value),
			fluctuationValue: X.toFloat(daxRisk['fluctuationValue'].value),
			isTrade: daxRisk['isTrade'].value
		};
		options[MHICommNo] = {
			symbol: 'HK$',
			commodityNo: MHICommNo,
			contractValue: X.toFloat(mhiRisk['contractValue'].value),
			exchangeRate: X.toFloat(mhiRisk['exchangeRate'].value),
			fluctuationValue: X.toFloat(mhiRisk['fluctuationValue'].value),
			isTrade: mhiRisk['isTrade'].value
		};

		getFuturesSale();
		X.engine.addTask(getFuturesSale, 3000);//持仓
		X.engine.addTask(getFuturesQuote, 1000);//行情
		X.engine.start();

	}

	//转换策略代号如CL1606 -->CL
	function getCommNo(commNo) {
		return commNo.replace(/\d+/, '');
	}

	//初始化risk数据，得到时候交易时间和holiday等参数
	function initRisk(data, commo) {
		var serverTime = data['nowTime'];
		var risk = JSON.parse(data['strRisk']);
		var holiday = SystemService.parseHoliday(risk['holiday'].value);
		var tradeTime = SystemService.parsePeriod(risk['tradingTimeLimit'].value);
		var quoteTime = SystemService.parsePeriod(risk['quoteTime'].value);
		//配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
		var isTrade = risk['isTrade'].value == '1';
		SystemService.setCurrentTime(serverTime);
		SystemService.setCurrentCurrencyType('USD');
		SystemService.setHoliday(holiday);
		SystemService.setTradePeriod(tradeTime);
		SystemService.setQuotePeriod(quoteTime, commo);
	}

	//查询持仓数据
	function getFuturesSale() {
		TradeService.getSaleFutures($scope.type).then(function (res) {
			var tradeData = res.data;
			if (tradeData.code == 100) {
				currentSaleFutures = tradeData.data;
				//保证查询持仓同时能获取行情数据
				getFuturesQuote();
				process();//此时已得到$scope.saleList

				$scope.upIDsArr = [];//看涨的策略ID
				$scope.downIDsArr = [];//看跌的策略ID
				$scope.allIDsArr = [];//所有ID

				$scope.saleList.forEach(function (currCommo) {
					var direction = currCommo['direction'];//交易方向（看张看跌）
					var status = currCommo['status'];//当前状态：持仓，正在卖出，正在买入
					var commoNo = currCommo['commodityNo'];//当前策略号
					var isTrade = options[commoNo]['isTrade'] == '1';//判断是否在交易时间内（可手动开关的）
					if (isTrade) {
						var isInPeriod = false;
						if (commoNo == 'HSI') {//分别取得判断时候在实际交易时间的配置参数
							initRisk(HSIRiskData.data, commoNo);
							isInPeriod = SystemService.isInPeriod(commoNo, 'trade')
						} else if (commoNo == 'GC') {
							initRisk(GCRiskData.data, commoNo);
							isInPeriod = SystemService.isInPeriod(commoNo, 'trade')
						} else if (commoNo == 'CL') {
							initRisk(CLRiskData.data, commoNo);
							isInPeriod = SystemService.isInPeriod(commoNo, 'trade')
						} else if (commoNo == 'SI') {
							initRisk(SIRiskData.data, commoNo);
							isInPeriod = SystemService.isInPeriod(commoNo, 'trade')
						} else if (commoNo == 'CN') {
							initRisk(CNRiskData.data, commoNo);
							isInPeriod = SystemService.isInPeriod(commoNo, 'trade')
						} else if (commoNo == 'DAX') {
							initRisk(DAXRiskData.data, commoNo);
							isInPeriod = SystemService.isInPeriod(commoNo, 'trade')
						} else if (commoNo == 'MHI') {
							initRisk(MHIRiskData.data, commoNo);
							isInPeriod = SystemService.isInPeriod(commoNo, 'trade')
						}
						if (isInPeriod && status == 4) {
							if (direction == 1) {
								$scope.upIDsArr.push(currCommo['id']);
							}
							if (direction == -1) {
								$scope.downIDsArr.push(currCommo['id']);
							}
						}
					}
					//将id数组转换成字符串
					$scope.upIDsArr.join(',');
					$scope.downIDsArr.join(',');
					$scope.allIDsArr = $scope.upIDsArr.concat($scope.downIDsArr);
				})

			} else {
				X.tip(tradeData['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	//查询行情数据
	function getFuturesQuote() {
		//是否在交易时段
		//查询持仓中对应的策略号'HSI','GC','CL'(可能并不会都存在)
		var commNoStr = getSaleCommNo(currentSaleFutures);
		if (commNoStr.length == 0)return;
		StockService.getFuturesSimpleQuote(commNoStr.join(',')).then(function (res) {
			var quoteData = res.data, quoteDataArray;
			if (quoteData.code == 100) {
				quoteDataArray = quoteData.data.split(';');
				//解析行情 ：  遍历行情，并将与行情相对应的当前买价与行情对应
				parseQuote(commNoStr, quoteDataArray);
				process();
			} else {
				X.tip(quoteData['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	//查询持仓中对应的策略代码'HSI','GC','CL'(可能并不会都存在)
	function getSaleCommNo(data) {
		var commNos = [];
		data.forEach(function (commObj) {
			var commodityNo = commObj['commodityNo'];
			commNos.indexOf(commodityNo) == -1 && commNos.push(commodityNo);//如果当前commoNos中没有commodityNo，则推入当前commodityNo
		});
		return commNos;
	}

	//解析行情 ：  遍历行情，并将与行情相对应的当前买价与行情对应
	function parseQuote(commNoStr, quoteDataArray) {
		if (quoteDataArray.length == commNoStr.length) {
			commNoStr.forEach(function (commNo, i) {
				var quoteData = quoteDataArray[i],
					quoteDataArr = quoteData.split(',');
				//与行情相对应的当前卖价
				currentPrices[commNo] = quoteDataArr[2];
			});
		}
	}

	//根据持仓获得的数据进行配置成需要的参数，并得到策略列表$scope.saleList
	function process() {
		$scope.saleList = [];
		$scope.total = 0;//总盈亏
		currentSaleFutures.forEach(function (commInfo) {
			var commNo = commInfo['commodityNo'];
			var currOptions = options[commNo];
			var buyPriceDeal = commInfo['buyPriceDeal'];
			var price = X.toFloat(currentPrices[commNo]);
			var direction = commInfo['direction'] == 'B' ? 1 : -1;
			var amount = commInfo['amount'];
			var symbol = currOptions.symbol;
			var status = commInfo['status'];

			//当前盈亏
			var currMoney = 0;
			var rmb = 0;
			//如果买价从行情获取到
			if (buyPriceDeal) {//                                          最小波动点数                              波动单价            涨跌方向
				currMoney = Math.round((price - buyPriceDeal) / currOptions.fluctuationValue * amount * currOptions.contractValue * direction * 100) / 100;
				//                                            汇率
				rmb = Math.round(currMoney * currOptions.exchangeRate * 100) / 100;
			}
			//商品数据初始化
			var commObj = {
				id: commInfo['id'],//策略ID
				amount: amount,//手数
				commodityName: commInfo['commodityName'],//策略名字
				commodityNo: commNo,//策略号
				buyPriceDeal: buyPriceDeal,//买入价
				contractNo: commInfo['contractNo'],
				dealTime: commInfo['dealTime'],//结算时间
				direction: direction,//交易方向：看掌柜看跌
				gainPrincipal: commInfo['gainPrincipal'],//最大止盈线
				lossPrincipal: commInfo['lossPrincipal'],//合约保证金
				quitLoss: commInfo['quitLoss'],//当前止损线
				quitGain: commInfo['quitGain'],//当前止盈线
				status: status,//当前策略状态
				price: currentPrices[commNo],//当前价
				currMoney: Math.round(currMoney * 100) / 100,//当前策略盈亏
				symbol: symbol,//货币符 ： $ HK$
				rmb: rmb,//当前盈亏转换为人名币后的金额
				quitCloseRatio: commInfo['quitCloseRatio']//点数
			};
			$scope.saleList.push(commObj);
			if (status > 3) {//状态为持仓和正在卖出时都要计算总盈亏
				$scope.total = Math.round(($scope.total + rmb) * 100) / 100;//总盈亏也会数显0.09999999999998/0.000000000001
			}
		});
	}

	//弹窗交互

	//弹出止盈止损窗口
	$scope.gainInput = 0;//初始化绑定输入框的ng-model
	$scope.lossInput = 0;
	var currCommoNo = '';//声明策略号，为后面弹窗实时显示当前策略盈亏做准备
	var currID = 0;//声明策略ID，准确取到当前策略的盈亏（currCommoNo && currID）
	$scope.setGainLoss = function (tradeID, setCommoNo, setGain, setLoss) {
		currCommoNo = setCommoNo;//弹框后将闯入的策略号赋值给之前生命的currCommoNo
		currID = tradeID;//得到当前ID
		$scope.gainInput = setGain;//将止盈止损线金额赋给input框中作为默认值
		$scope.lossInput = setLoss;
		var addObj = options[setCommoNo];//策略号对应的风控配置参数
		willSaleTradeID = tradeID;//若点击的是单挑测U额，ID只有一个，赋给willSaleTradeID
		$scope.currCommoID = 1;//弹出止盈止损窗口

		var quitCloseRatio = 0;//止损线点数
		var addContractValue = addObj['contractValue'],//最小波动点的对应货币价格
			addExchangeRate = addObj['exchangeRate'];//汇率

		$scope.saleList.forEach(function (gainLossObj) {//遍历saleList取到当前ID对应的相关数据
			var gainLossID = gainLossObj['id'];//当前策略ID
			if (gainLossID == tradeID) {
				quitCloseRatio = gainLossObj['quitCloseRatio'];//止损线点数
				$scope.setWindowObj = {
					setGainPrincipal: gainLossObj['gainPrincipal'],//最大止盈线金额
					setCommoName: gainLossObj['commodityName'],//策略name
					setCommoNo: gainLossObj['commodityNo'],//策略号
					setDirection: gainLossObj['direction'],//交易方向
					setAmount: gainLossObj['amount'],//手数
					setContractNo: gainLossObj['contractNo']//策略编号：1606....
				};
				//一个波动点的价格 * 手数 * 汇率 = 单个策略最小波动价格
				$scope.onePointPrice = Math.round(addContractValue * addExchangeRate * $scope.setWindowObj['setAmount'] * 100) / 100;//当前策略止盈止损允许的按钮最低调整价
			}
		});

		$scope.setLossPrincipal = Math.round($scope.onePointPrice * quitCloseRatio * 100) / 100 | 0;//当前策略的最低止损线金额

		getPrice();//获取当前价
		X.engine.addTask(getPrice, 1000);//1秒取一次
	};

	//取当前策略的当前价
	function getPrice() {
		var currPrice = 0;
		$scope.saleList.forEach(function (currObj) {
			if (currCommoNo == currObj['commodityNo'] && currID == currObj['id'])
				currPrice = currObj['rmb'];
		});
		$scope.rmb = currPrice;
	}

	//                      止盈/止损 金额  + / -
	$scope.setAdd = function (type, data, flag) {//按钮的算法
		data += $scope.onePointPrice * flag;
		if (type == 'gain') {
			$scope.gainInput = Math.round(data * 100) / 100;//保留两位小数
			if ($scope.gainInput > $scope.setWindowObj['setGainPrincipal']) {//如果大于最大止盈金额，则设置成最大止盈金额
				$scope.gainInput = $scope.setWindowObj['setGainPrincipal'];
			} else if ($scope.gainInput < $scope.onePointPrice) {//如果小于最小波动点金额 * 手数，则设置成最小波动点金额 * 手数
				$scope.gainInput = $scope.onePointPrice;
			}
		} else {
			$scope.lossInput = Math.round(data * 100) / 100;
			if ($scope.lossInput > $scope.setLossPrincipal) {
				$scope.lossInput = $scope.setLossPrincipal;
			} else if ($scope.lossInput < $scope.onePointPrice) {
				$scope.lossInput = $scope.onePointPrice;
			}
		}
	};


	//止盈止损确认
	$scope.confirmGainLoss = function () {//止盈止损金额大于最大止盈止损，或者小于onPointPrice时，自动调整为最大最小限定值，并提示
		if ($scope.gainInput > $scope.setWindowObj['setGainPrincipal']) {
			X.dialog.alert('止盈金额不能大于' + $scope.setWindowObj['setGainPrincipal'], {
				notify: function () {
					$scope.gainInput = $scope.setWindowObj['setGainPrincipal'];
				}
			});
			return
		}
		if ($scope.gainInput < $scope.onePointPrice) {
			X.dialog.alert('止盈金额不能小于' + $scope.onePointPrice, {
				notify: function () {
					$scope.gainInput = $scope.onePointPrice;
				}
			});
			return
		}
		if ($scope.lossInput > $scope.setLossPrincipal) {
			X.dialog.alert('止损金额不能大于' + $scope.setLossPrincipal, {
				notify: function () {
					$scope.lossInput = $scope.setLossPrincipal;
				}
			});
			return
		}
		if ($scope.lossInput < $scope.onePointPrice) {
			X.dialog.alert('止损金额不能小于' + $scope.onePointPrice, {
				notify: function () {
					$scope.lossInput = $scope.onePointPrice;
				}
			});
			return
		}

		var setLoss = $scope.lossInput.toFixed(2), setGain = $scope.gainInput.toFixed(2);
		TradeService.setQuitGainLoss(willSaleTradeID, $scope.type, setLoss, setGain).then(function (res) {
			$scope.currCommoID = 0;
			var setData = res.data;
			if (setData.code == 100) {
				X.dialog.alert('设置成功');
				getFuturesSale();
			} else {
				X.tip(setData['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//弹出平仓交易窗口                  当前ID    策略号     交易方向        止损线点数       手数      状态
	$scope.sellOutDialog = function (tradeID, commo, tradeDirection, tradeCloseRadio, amount, status) {
		willSaleTradeID = tradeID;
		sellCommoNo = commo;
		TradeService.getRisk(commo).then(function (res) {
			var riskData = res.data;
			if (riskData.code == 100) {
				var riskStr = riskData.data['strRisk'];
				var risk = JSON.parse(riskStr);
				var isTrade = risk['isTrade'].value == '1';//判断是否暂停交易
				initRisk(riskData.data, sellCommoNo);//得到节假日，是否暂停交易等信息
				var isInPeriod = SystemService.isInPeriod(commo, 'trade');
				var tradeT = SystemService.beyondTradeTimeTips(commo);
				if (isTrade) {
					if (!isInPeriod) {
						X.dialog.alert(tradeT);
					}
					else {
						$scope.sellOutID = 1;
					}
				} else {
					X.dialog.alert('暂停交易');
				}
			}
		}).catch(function () {
			X.tip('服务器异常');
		});
		$scope.tradeDirection = tradeDirection;
		$scope.quitCloseRatio = tradeCloseRadio;
		$scope.status = status;
		$scope.amount = amount;
	};

	$scope.chooseAllSell = function () {
		$scope.allSellStatus = 0;   //状态为0：全选，1：选择涨，2：选择跌
	};

	$scope.chooseAllUp = function () {
		$scope.allSellStatus = 1;
	};

	$scope.chooseAllDown = function () {
		$scope.allSellStatus = 2;
	};
	//弹出全部平仓窗口
	$scope.allSellDialog = function () {
		$scope.sellAllID = 1;
		$scope.allSellStatus = 0;
		if ($scope.upIDsArr.length == $scope.allIDsArr.length || $scope.downIDsArr.length == $scope.allIDsArr.length) $scope.allSellStatus = 0;
	};

	$scope.choiceStatus = 0;//根据状态来判断选择了即时平仓还是马上看跌，0：即时平仓，1：即时平仓，马上看跌/看涨
	$scope.chooseSellOut = function () {
		$scope.choiceStatus = 0;
	};

	$scope.chooseBackHand = function () {//及时平仓，立即反手
		$scope.choiceStatus = 1;
	};

	//平仓
	$scope.sellCurrCommodity = function () {
		$scope.closeFeaturesData = [];
		//根据选择的卖出种类以及笔数来选择全部/看涨/看跌IDs,若没有选择的是全部平仓，则willSaleTradeID为当前单条策略的ID
		if ($scope.sellAllID == 1) {//当全部平仓窗口弹出时，才对willSaleTradeID进行赋值操作。此前bug：当看涨IDs提交后，willSaleTradeID = [],当点击单个平仓后allSellStatus还等于1，但是willSaleTradeID是空数组，所以会出现点击单个平仓时出现策略ID为空。
			if ($scope.allSellStatus == 0) {
				willSaleTradeID = $scope.allIDsArr;
			} else if ($scope.allSellStatus == 1) {
				willSaleTradeID = $scope.upIDsArr;
			} else if ($scope.allSellStatus == 2) {
				willSaleTradeID = $scope.downIDsArr;
			}
		}
		$scope.sellAllID = 0;

		if (!willSaleTradeID) {
			X.tip('策略ID不能为空');
			return;
		}
		X.loading.show();
		TradeService.getCloseFutures(willSaleTradeID, $scope.type).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				getFuturesSale();
				var dataInfoArr = data.data.split(';');
				var sucNum = X.toFloat(dataInfoArr[0]);
				var failNum = X.toFloat(dataInfoArr[1]);
				var allDeal = sucNum + failNum;
				if (willSaleTradeID.length > 1) {
					X.dialog.alert('<h3>委托卖出提交完毕</h3><br>' + '共' + allDeal + '笔，' + '成功' + sucNum + '笔，' + '失败' + failNum + '笔');
				} else {
					if ($scope.choiceStatus == 0) {
						if (sucNum == 1) {
							X.dialog.alert('委托卖出成功');
							$scope.sellOutID = 0;
						} else {
							X.dialog.alert('委托卖出失败');
							$scope.sellOutID = 0;
						}
					} else {
						if (sucNum != 1) {
							X.dialog.alert('委托卖出失败');
							$scope.sellOutID = 0;
						}
						else {
							$scope.closeFeaturesData = data.data;
							if ($scope.tradeDirection == 1) {
								$scope.sellBuy = 'sell';
							} else {
								$scope.sellBuy = 'buy';
							}
							$location.url('/outerTradeBuy' + '/' + sellCommoNo + '/' + $scope.type + '/' + $scope.sellBuy + '?' + 'quitCloseRatio=' + $scope.quitCloseRatio + '&amount=' + $scope.amount);
						}
					}
				}
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	$scope.cancelDialog = function () {
		if ($scope.sellAllID == 1 || $scope.sellOutID == 1 || $scope.currCommoID == 1) {
			$scope.sellAllID = 0;
			$scope.sellOutID = 0;
			$scope.currCommoID = 0;
		}
	};

	$scope.$on('$destroy', function () {
		X.engine.destroy();
	});
});
//外盘-结算
myControllers.controller('OuterTradeResultCtrl', function ($scope, $q, $routeParams, TradeService) {
	$scope.commodityNo = $routeParams.commodityNo || "CL";
	$scope.type = $routeParams.type || "2";
	if ($scope.type != "1") {
		$scope.type = "2";
	}
	$scope.commodityTitles = {
		MHI: '小恒指',
		HSI: '恒指',
		GC: '美黄金',
		SI: '美白银',
		CL: '美原油',
		CN: '富时A50',
		DAX: '德指'
	};
	$scope.futureInfo = {
		commodityTitle: $scope.commodityTitles[$scope.commodityNo]
	};

	var pageSize = 10;//一页显示的条数
	$scope.settleDataList = [];
	$scope.currPage = 1;//当前页码
	$scope.totalPage = 1;//总页数

	$scope.getSettleList = function (page) {
		X.loading.show();
		TradeService.getTradeResult(page, pageSize, $scope.type).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var list = data.data['dataList'];
				$scope.currPage = data.data['pageIndex'];
				$scope.totalPage = data.data['totalPage'];
				if (page == 1) {
					$scope.settleDataList = list;
				} else {
					$scope.settleDataList = $scope.settleDataList.concat(list);
				}
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};
	$scope.getSettleList($scope.currPage);//取得第一页

	//显示当前选择的结算详情
	$scope.currTrade = 0;
	$scope.showCurrTradeDetail = function (tradeId) {
		if ($scope.currTrade == tradeId) {
			$scope.currTrade = 0;
		} else {
			$scope.currTrade = tradeId;
		}
	};
});
//
myControllers.controller('DevCtrl', function ($scope, SystemService) {
	$scope.showAlertDialog = false;
	$scope.showAlertDialog1 = false;
	$scope.showConfirmDialog = false;

	$scope.test111 = function () {
		var a = '06:00,12:00|13:00,14:00|16:00,24:00|00:00,04:55',
			b = '06:00,12:00|13:00,14:00|16:00,24:00',
			c = '03:00,04:55;06:00,12:00;13:00,14:00|16:00,24:00|00:00,02:00';
		//console.log(SystemService.parsePeriod(c));
		console.log(SystemService.beyondTradeTimeTips('HSI'));
	};

	$scope.test = function () {
		console.log('test');
		$scope.showAlertDialog = false;
		$scope.showAlertDialog1 = true;
	};
	$scope.test1 = function () {
		console.log('test1');
		$scope.showAlertDialog1 = false;
	};
	$scope.cancelNotify = function () {
		alert('逗逼真尼玛小气！o(︶︿︶)o 唉');
		$scope.showConfirmDialog = false;
	};
	$scope.sureNotify = function () {
		alert('逗逼真尼玛大方！o(∩_∩)o 哈哈');
		$scope.showConfirmDialog = false;
	};
});

//红包 act
myControllers.controller('ActPacketCtrl', function ($scope, $location, StockService, PacketService) {
    var activityId = $location.search()['activityId'];
    $scope.TipInfo = [];

    function TipInfo(id) {
        X.loading.show();
        PacketService.getActAwardSetInfo(id).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                if (!data || data.length == 0) {
                    $scope.TipInfo = [];
                } else {
                    $scope.TipInfo = data.data;
                }
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

	/*function actPacketData(data) {
	 data.forEach(function (item) {
	 $scope.TipInfo[item.title] = item;
	 });

	 X.log(data);
	 }*/

	$scope.receivePacket = function (obj) {
		// $event.stopPropagation();//阻止事件冒泡到上层节点而触发上级的事件
		X.loading.show();
		X.log(obj);
		PacketService.receiveTipByActivity(obj.title, obj.awardLogId, obj.value).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('领取成功');
				TipInfo(activityId);
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	$scope.goURL = function (name, status) {
		if (name == 'ZCHB' && status == 0) {
			$location.url('/register1?backURL=#/actPacket?activityId=' + activityId);
		} else if (name == 'MNJY' && status == 0) {
			$location.url('/outerTrade/CL/1?backURL=#/actPacket?activityId=' + activityId);
		} else if (name == 'SCCZ' && status == 0) {
			$location.url('/payType?backURL=#/actPacket?activityId=' + activityId);
		} else if (name == 'SPJY' && status == 0) {
			$location.url('/outerTrade/CL/2?backURL=#/actPacket?activityId=' + activityId);
		} else if (name == 'SMRZ' && status == 0) {
			$location.url('/identification?backURL=#/actPacket?activityId=' + activityId)
		} else {
			return;
		}
	};

	TipInfo(activityId);
});
//我的红包
myControllers.controller('MyPacketCtrl', function ($scope, $rootScope, $q, $location, LoginService, UserService, AuthService, PacketService) {
	$scope.packetFund = {};
	$scope.packetRecord = [];
	$scope.packetTitle = {
		'ZCHB': ['新注册用户送红包'],
		'MNJY': ['完成模拟交易5次送红包'],
		'SCCZ': ['首次充值送红包'],
		'SPJY': ['实盘交易送红包'],
		'SMRZ': ['完成实名认证送红包'],
		'JYZHF': ['实盘交易综合费返还', '实盘交易综合费抵扣']
};
	$scope.pageIndex = 1;
	$scope.totalPage = 1;
	X.loading.show();
	$q.all({packetFund: PacketService.getPacketFundInfoData()}).then(function (res) {
		var packetFund = res.packetFund.data;
		if (packetFund.code == 100) {
			$scope.packetFund = packetFund.data;
			$scope.getPacketRecordList($scope.pageIndex);
		} else {
			if (packetFund.code != 100) {
				X.tip(packetFund['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});
	$scope.getPacketRecordList = function () {
		var pageSize = 10;
		X.loading.show();
		PacketService.getPacketRecordListData().then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				// var packetData = data.data;
				/*$scope.pageIndex = packetData['pageIndex'];
				 $scope.totalPage = packetData['totalPage'];
				 if (page == 1) {
				 $scope.items = packetData.items;
				 } else {
				 $scope.items = $scope.items.concat(packetData.items);
				 }*/
				$scope.items = data.data.items;
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

});
//红包列表
myControllers.controller('ActivityCenterCtrl', function ($scope, $location, PacketService) {
	$scope.activityList = [];
	PacketService.getActivityInfo().then(function (res) {
		var data = res.data;
		if (data.code == 100) {
			if (data.data) {
				data.data.forEach(function (item) {
					item.bannerUrl = item.bannerUrl.split(',');
				});
				$scope.activityList = data.data;
			} else {
				$scope.activityList = [];
			}
		} else {
			$scope.activityList = [];
		}
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	$scope.goURL = function (id) {
		$location.url('/actPacket' + '?activityId=' + id);
	}
});
//推广赚钱
myControllers.controller('ExtensionCtrl', function ($scope, $q, $location, ExtensionService) {
	var pageSize = 10,
		pageIndex = 1;
	$scope.type = 'detail';
	$scope.extensionInfo = {};
	$scope.totalUserCount = '';
	$scope.tradeCount = '';
	$scope.showGenerateLink = false;
	var ratio = 0;

	X.loading.show();
	$q.all({
		extensionInfo: ExtensionService.getExtensionInfoData()
	}).then(function (res) {
		var extensionInfo = res.extensionInfo.data;
		if (extensionInfo.code == 100) {
			$scope.extensionInfo = extensionInfo.data;
			ratio = $scope.extensionInfo['ratio'];
			X.clipboard.init();
			$scope.wechatCode = '/home/generalize/getQRcode.json?device=1';
		} else {
			if (extensionInfo.code != 100) {
				X.tip(extensionInfo['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	/*$scope.getExtensionUserList = function (page) {
	 X.loading.show();
	 ExtensionService.getExtensionUserListData(page, pageSize).then(function (res) {
	 var data = res.data;
	 if (data.code == 100) {
	 var extensionUserData = data.data;
	 $scope.pageIndex = extensionUserData['pageIndex'];
	 $scope.totalPage =extensionUserData['totalPage'];
	 $scope.totalUserCount=extensionUserData['totalUserCount'];
	 $scope.tradeCount=extensionUserData['tradeCount'];
	 if (page == 1) {
	 $scope.items = extensionUserData.dataList;
	 } else {
	 $scope.items = $scope.items.concat(extensionUserData.items);
	 }
	 } else {
	 X.tip(data['resultMsg']);
	 }
	 X.loading.hide();
	 }).catch(function () {
	 X.tip('服务器请求异常');
	 });
	 }
	 $scope.getExtensionUserList(pageIndex);*/

	$scope.getUsers = function (page) {
		$scope.type = 'user';
		if (ratio == 0) {
			$location.url('/login?goURL=/extension');
			return;
		}
		X.loading.show();
		ExtensionService.getExtensionUserListData(page, pageSize).then(function (res) {
			var users = res.data;
			if (users.code == 100) {
				var usersData = users.data;
				init(usersData);
			} else {
				X.tip(users['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	function init(data) {
		var list = data.dataList;
		$scope.pageIndex = data.pageIndex;
		$scope.totalPage = data.totalPage;
		$scope.tradeCount = data.tradeCount;
		$scope.totalUserCount = data.totalUserCount;
		/*for (var i in list) {
		 list[i].registerTime = X.formatDate(list[i].registerTime);
		 }*/

		if ($scope.pageIndex == 1) {
			$scope.items = list;
		} else {
			$scope.items = $scope.items.concat(list);
		}
	}

	//获取数据列表
	$scope.getExtensionUserList = function (page) {
		page = page || 1;
		$scope.getUsers(page);
	};

	// getUsers(pageIndex);
});
//关注微信
myControllers.controller('AttentionCtrl', function ($scope, $location) {
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}
});
//支付宝认证
myControllers.controller('AliPayIdentificationCtrl', function ($scope, $location, $q, UserService) {
	$scope.alipayAccount = '';
	$scope.tradeAmount = '';
	$scope.tradeNo = '';
	$scope.submitAliPay = function () {
		if (!$scope.tradeAmount && $scope.tradeAmount != '') {
			$scope.tradeAmount = '';
		}

		function isMoney(data, isPositive) {
			return isPositive ? /^\d+(\.\d{0,2})?$/.test(data) && parseFloat(data) > 0 : /^(-)?\d+(\.\d{1,2})?$/.test(data);
		}

		if ($scope.alipayAccount == '') {
			X.tip('请输入支付宝账号');
			return;
		} else if (!X.isMobile($scope.alipayAccount) && !X.isEmail($scope.alipayAccount)) {
			X.tip('支付宝账号输入错误');
			return;
		} else if ($scope.tradeAmount == '') {
			X.tip('请输入充值金额');
			return;
		} else if ($scope.tradeAmount < 1) {
			X.tip('充值金额最低1元');
			return;
		} else if (!isMoney($scope.tradeAmount, true)) {
			X.tip('充值金额错误');
			return;
		} else if ($scope.tradeAmount > 100000) {
			X.tip('充值金额最高10万元');
			return;
		} else if ($scope.tradeNo == '') {
			X.tip('请输入支付宝订单号');
			return;
		} else if ($scope.tradeNo.length < 12) {
			X.tip('支付宝订单号错误');
			return;
		}

		UserService.bindingAlipayAccount($scope.alipayAccount, $scope.tradeAmount, $scope.tradeNo).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('认证成功');
				$location.url('/myInfo');
			} else if (data.code == 501) {
				X.tip(data['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}
});
//手机绑定
myControllers.controller('PhoneBind1Ctrl', function ($scope, $q, $location, $interval, UserService,SystemService) {
	var timer = null, changeTimer = null;

	$scope.user = {};
	$scope.mobile = '';
	$scope.time = 0;
	$scope.temptimes = Date.now();
	$scope.checkCode = '';//验证码
	$scope.imgCode = '';
	$scope.showCodeDialog = false;

	X.loading.show();
	$q.all({userInfo: UserService.getUserInfo()}).then(function (res) {
		var userInfoData = res.userInfo.data;
		if (userInfoData.code == 100) {
			$scope.user = userInfoData.data;
		} else {
			X.tip(userInfoData['resultMsg']);
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	$scope.clickNumber = function(){
		$scope.cellPhone = SystemService.cellPhoneNumber();
	};

	//下一步
	$scope.toNext = function () {
		/*if ($scope.checkCode == '') {
		 X.tip('请输入短信验证码');
		 return false;
		 }*/
		if (!/^\d{6}$/.test($scope.checkCode)) {
			X.tip('验证码输入错误');
			$scope.refreshCode();
			return false;
		}
		//手机号解绑
		X.loading.show();
		UserService.unbindMobile($scope.checkCode).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$location.path('/phoneBind2');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//显示图片验证码
	$scope.getImgCode = function () {
		$scope.showCodeDialog = true;
	};

	//原手机号短信验证
	$scope.sendCode = function () {
		if ($scope.imgCode == '') {
			X.tip('请输入图片验证码');
			return false;
		}
		if (!/^\d{4}$/.test($scope.imgCode)) {
			X.tip('图片验证码输入错误');
			$scope.refreshCode();
			return false;
		}
		//发送验证码请求
		X.loading.show();
		UserService.mobileUnbindCode($scope.imgCode).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$scope.closeDialog();
				X.tip('验证码发送成功，请注意查收短信');
				$scope.time = 60;
				timerFn();
			} else if (data.code == 101) {
				$scope.closeDialog();
				X.tip('验证码发送成功，请注意查收短信');
				$scope.time = data.data.interval;
				timerFn();
			} else {
				X.tip(data['resultMsg']);
				$scope.refreshCode();
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	//刷新验证码
	$scope.refreshCode = function () {
		$scope.temptimes = Date.now();
	};

	// 关闭弹出框
	$scope.closeDialog = function () {
		$scope.showCodeDialog = false;
	};

	//倒计时方法
	function timerFn() {
		timer = setInterval(function () {
			if ($scope.time > 0) {
				$scope.$apply(function () {
					$scope.time--;
				});
			} else {
				timer && clearTimeout(timer);
			}
		}, 1000);
	}

	//定时器，用来检测输入框是否有内容 ，并来修改样式
	function changeBtnTimer() {
		changeTimer = $interval(function () {
			$scope.btnState = 'disabled';
			$scope.btnDisabled = true;
			if ($scope.checkCode.length == 6) {
				$scope.btnState = 'blue';
				$scope.btnDisabled = false;
			} else {
				$scope.btnState = 'disabled';
				$scope.btnDisabled = true;
			}
		}, 100);
	}

	//清空定时器
	function clearTimer() {
		$scope.time = 0;
		timer && clearTimeout(timer);
		changeTimer && $interval.cancel(changeTimer);
		changeTimer = timer = null;
	}

	//卸载页面的定时器
	$scope.$on('$destroy', function () {
		clearTimer();
	});

	changeBtnTimer();
});
myControllers.controller('PhoneBind2Ctrl', function ($scope, $routeParams, $q, $location, $interval, UserService) {
	var timer = null, changeTimer = null;
	$scope.mobile = '';
	$scope.oldMobile = '';
	$scope.time = 0;
	$scope.temptimes = Date.now();
	$scope.checkCode = '';//验证码
	$scope.imgCode = '';
	$scope.showCodeDialog = false;

	/*$scope.oldMobile = $routeParams['mobile'] || '';
	 if ($scope.oldMobile == '') {
	 $location.url('/PhoneBind1');
	 }*/

	X.loading.show();
	$q.all({userInfo: UserService.getUserInfo()}).then(function (res) {
		var userInfoData = res.userInfo.data;
		if (userInfoData.code == 100) {
			$scope.oldMobile = userInfoData.data.loginMobileNoHidden;
		} else {
			X.tip(userInfoData['resultMsg']);
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//绑定手机号
	$scope.bind = function () {
		/*if ($scope.mobile == '') {
		 X.tip('请输入手机号码');
		 return false;
		 }*/
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码输入错误');
			return false;
		}
		/*if ($scope.checkCode == '') {
		 X.tip('请输入短信验证码');
		 return false;
		 }*/
		if (!/^\d{6}$/.test($scope.checkCode)) {
			X.tip('验证码输入错误');
			$scope.refreshCode();
			return false;
		}
		//绑定手机号
		X.loading.show();
		UserService.bindMobile($scope.checkCode, $scope.mobile).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				X.tip('手机绑定成功');
				$location.path('myInfo');
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	//显示图片验证码
	$scope.getImgCode = function () {
		if ($scope.mobile == '') {
			X.tip('请输入手机号码');
			return false;
		}
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码输入错误');
			/*$scope.refreshCode();*/
			return false;
		}
		$scope.showCodeDialog = true;
	};

	//获取验证码
	$scope.sendCode = function () {
		if ($scope.mobile == '') {
			X.tip('请输入手机号码');
			return false;
		}
		if (!X.isMobile($scope.mobile)) {
			X.tip('手机号码输入错误');
			return false;
		}
		if ($scope.imgCode == '') {
			X.tip('请输入图片验证码');
			return false;
		}
		if (!/^\d{4}$/.test($scope.imgCode)) {
			X.tip('图片验证码输入错误');
			$scope.refreshCode();
			return false;
		}
		if ($scope.mobile == $scope.oldMobile) {
			X.tip('新手机号码不能和旧手机号相同');
			$scope.closeDialog();
			$scope.refreshCode();
			return false;
		}
		//发送短信验证码请求
		X.loading.show();
		UserService.mobileBindCode($scope.imgCode, $scope.mobile).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$scope.closeDialog();
				X.tip('验证码已发送至手机，请注意查收');
				$scope.time = 60;
				timerFn();
			} else if (data.code == 101) {
				$scope.closeDialog();
				X.tip('验证码已发送至手机，请注意查收');
				$scope.time = data.data.interval;
				timerFn();
			} else {
				X.tip(data['resultMsg']);
				$scope.closeDialog();
				$scope.refreshCode();
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	// 关闭弹出框
	$scope.closeDialog = function () {
		$scope.showCodeDialog = false;
		$scope.imgCode = '';
	};

	//刷新验证码
	$scope.refreshCode = function () {
		$scope.temptimes = Date.now();
	};

	//倒计时方法
	function timerFn() {
		timer = setInterval(function () {
			if ($scope.time > 0) {
				$scope.$apply(function () {
					$scope.time--;
				});
			} else {
				timer && clearTimeout(timer);
			}
		}, 1000);
	}

	//定时器，用来检测输入框是否有内容 ，并来修改样式
	function changeBtnTimer() {
		changeTimer = $interval(function () {
			$scope.btnState = 'disabled';
			$scope.btnDisabled = true;

			if ($scope.mobile.length == 11 && $scope.checkCode.length == 6) {
				$scope.btnState = 'blue';
				$scope.btnDisabled = false;
			} else {
				$scope.btnState = 'disabled';
				$scope.btnDisabled = true;
			}
		}, 100);
	}

	//清空定时器
	function clearTimer() {
		$scope.time = 0;
		timer && clearTimeout(timer);
		changeTimer && $interval.cancel(changeTimer);
		changeTimer = timer = null;
	}

	//卸载页面的定时器
	$scope.$on('$destroy', function () {
		clearTimer();
	});

	changeBtnTimer();
});
//资讯
myControllers.controller('NewsCtrl', function ($scope, $location, $sce, $window, NoticeService) {
	$scope.showHeader = true;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
	}

	$scope.newsList = [];
	$scope.page = 0;
	$scope.month = '';
	$scope.day = '';

	var lastTime = 0;
	var firstTime = 0;
	var dataLoadFinish = false;


	function getNewsList(page, time) {
		X.loading.show();
		NoticeService.getNewsList(page, 30, time).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var news = data.data || [];
				if (news.length > 0) {
					news.forEach(function (strMsg) {
						var msg = processNews(strMsg);
						if (/链接>>>|activity\.jin10\.com|live\.jin10\.com|app\.jin10\.com|v\.jin10\.com|news\.jin10\.com/.test(msg.content)) {
							return;
						}
						$scope.newsList.push(msg);
					});
					firstTime = $scope.newsList[0].id;
					lastTime = $scope.newsList[$scope.newsList.length - 1].id.substring(0, 17);
					getNewsCurrDate($scope.newsList);
					$scope.page++;
					//如果没有数据则忽略滚动事件
					dataLoadFinish = true;
				} else {
					X.tip('到底了，没有新数据了');
				}
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	function getNewsCurrDate(newsList) {
		if (newsList.length < 1) {
			return;
		}

		var firstDate = newsList[0].date;
		var dateArr = firstDate.split('-');
		$scope.month = dateArr[1];
		$scope.day = dateArr[2];
	}

	function getNew() {
		//X.loading.show();
		NoticeService.getNewsList(0, 20).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var news = data.data || [];
				if (news.length > 0) {
					var newData = [];
					for (var i = 0, len = news.length; i < len; i++) {
						var msg = processNews(news[i]);
						if (/链接>>>|activity\.jin10\.com|live\.jin10\.com|app\.jin10\.com|v\.jin10\.com|news\.jin10\.com/.test(msg.content)) {
							continue;
						}
						if (msg.id === firstTime) {
							break;
						}
						newData.push(msg);
					}
					if (newData.length > 0) {
						$scope.newsList = newData.reverse().concat($scope.newsList);
						firstTime = $scope.newsList[0].id;
					}
					getNewsCurrDate($scope.newsList);
				}
			} else {
				X.tip(data['resultMsg']);
			}
			//X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	/**
	 * {
         *     important       标红
         *     type            消息类型
         *     time            时间
         *     websiteUrl
         *     showIcon        显示浏览器图标
         *     showImgIcon     显示图片图标
         *     iconName        图标名称
         *     imgName         图片图标名称
         *     content         详细内容
         *     country         国家名称
         *     prefix          前值
         *     expected        预期值
         *     published       公布值
         *     star            分数
         *     evaluate        评价
         * }
	 * @type {Array}
	 */
	function processNews(data) {
		data = data.split('#');
		var type = data[0],
			date,
			time,
			content,
			important,
			star = 0,
			websiteUrl = '',
			videoUrl = '',
			id,
			imgIcon,
			prefix = 0,
			expected = 0,
			published = 0,
			country,
			evaluate,
			params = {};

		if (type == 1) {
			date = data[8].split(' ')[0];
			time = data[8].split(' ')[1];
			content = $sce.trustAsHtml(data[2].replace(/\/br/g, 'br'));
			star = data[6];
			important = (star > 3);
			id = data[12];
			prefix = data[3];
			expected = data[4];
			published = data[5];
			country = data[9];
			evaluate = data[7];
			params = {
				id: id,
				important: important,
				type: 1,
				date: date,
				time: time,
				content: content,
				country: country,
				prefix: prefix,
				expected: expected,
				published: published,
				star: star,
				evaluate: star >= 3 ? getChangeClassText(evaluate) : getChangeClassText(evaluate + '2')
			};
		} else {
			date = data[2].split(' ')[0];
			time = data[2].split(' ')[1];
			content = $sce.trustAsHtml(data[3].replace(/\/br/g, 'br'));
			important = (data[1] == 0);
			id = data[11];
			websiteUrl = data[4];
			imgIcon = data[6];
			videoUrl = data[5];
			params = {
				id: id,
				important: important,
				type: 0,
				date: date,
				time: time,
				content: content,
				websiteUrl: websiteUrl,
				showWebsiteIcon: websiteUrl ? true : false,
				videoUrl: videoUrl,
				showVideoIcon: videoUrl ? true : false,
				showImgIcon: imgIcon ? true : false,
				imgName: imgIcon,
				imgUrl: imgIcon.replace('_lite', '')
			};
		}
		return params;
	}

	function getChangeClassText(text) {
		var classn = "";

		if (text == "利多") {
			classn = "liduo";
		} else if (text == "利空") {
			classn = "likong";
		} else if (text == "无影响") {
			text = "影响较小";
			classn = "wuyingxiang";
		} else if (text == "利多2") {
			text = "利多";
			classn = "liduo2";
		} else if (text == "利空2") {
			text = "利空";
			classn = "likong2";
		} else if (text == "无影响2") {
			text = "影响较小";
			classn = "wuyingxiang2";
		}

		var rege = new RegExp("影响");
		if (rege.test(text)) {
			text = "影响较小";
		}

		if (text != "影响较小") {
			text += " 金银";
		}
		return {className: classn, text: text};
	}

	getNewsList(0);
	X.engine.addTask(getNew, 10000);
	X.engine.start();

	var win = angular.element($window);
	win.on('scroll', function () {
		if (dataLoadFinish) {
			var elem = angular.element('.viewport');
			var H = win.height();
			var T = win.scrollTop();
			var eH = elem.height();
			if ((2 * H + T) > eH) {
				dataLoadFinish = false;
				getNewsList($scope.page, lastTime);
			}
		}
	});

	$scope.$on('$destroy', function () {
		X.engine.destroy();
		win.off('scroll');
	});
});


//一元实盘----------------------------

//活动页
myControllers.controller('OneYuanIntroduceCtrl', function ($scope, $q, $location, UserService) {
	$scope.user = {};

	$scope.showHeader = true;
	var windowHeight = window.screen.height, imgHeight = $('.header-banner img').width() / 1.61;
	var source = $location.search()['source'];
	if (source && source == 'IOSAPP') {
		$scope.showHeader = false;
		if (windowHeight > (50 + imgHeight + 386)) {
			$('.mod-detail')[0].style.height = windowHeight - 64 - imgHeight + 'px';
		}
	}

	$scope.showDialog = false;
	$scope.showCloseDialog = function () {
		$scope.showDialog = !$scope.showDialog;
	};

	/*$scope.goBuy = function () {
	 if (!$scope.showHeader) {
	 window.location.href = 'yztz://ycl.yztz.com/actTrade';
	 } else if (!userType) {
	 $location.url('/login?goURL=/oneYuanIntroduce');
	 } else {
	 $location.url('/oneYuanTrade');
	 }
	 };*/

	if (windowHeight > (50 + imgHeight + 386)) {
		$('.mod-detail')[0].style.height = windowHeight - (50 + imgHeight) + 'px';
	}

	$scope.goBuy = function () {
		if (!$scope.showHeader) {
			window.location.href = 'clb://clb.yztz.cn/actTrade';
		} else {
			X.loading.show();
			$q.all({
				userInfo: UserService.getUserInfo()//获取用户基本信息
			}).then(function (res) {
				var userInfoData = res.userInfo.data;

				if (userInfoData.code == 100) {
					$scope.user = userInfoData.data;
					$location.path("/oneYuanTrade");
				} else {
					if (userInfoData.code != 100) {
						X.tip(userInfoData['resultMsg']);
						$location.url("/login?goURL=/oneYuanIntroduce")
					}
				}
				X.loading.hide();
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}
	}
});
//点买
myControllers.controller('OneYuanTradeCtrl', function ($scope, $q, $routeParams, TradeService, StockService, SystemService) {
	$scope.uuid = SystemService.uuid();
	$scope.commodityNo = 'MHI';
	$scope.type = '2';

	/*if ($scope.type != '1') {
	 $scope.type = '2';
	 }*/
	var chartOpts = {
		sline: {
			MHI: {
				wrap: 'sline-wrap-' + $scope.uuid,
				scale: 0
			}
		},
		kline: {
			MHI: {
				wrap: 'kline-wrap-' + $scope.uuid
			}
		},
		tline: {
			MHI: {
				wrap: 'tline-wrap-' + $scope.uuid,
				unit: 1,
				multiple: 2
			}
		}
	};
	//分时数据上一次查询是否已经完成，是否开启交易
	var isLoadFuturesQuote = true, isTrade = false;
	var tChart, sChart, kChart, QUOTE_DATA, CACHE_KLINE;
	$scope.commodityTitles = {
		MHI: '小恒指'
	};
	$scope.showMenu = false;
	$scope.futureInfo = {};
	$scope.currType = 'sline';
	$scope.tips = '';
	$scope.isInPeriod = false;

	X.loading.show();
	$q.all({
		risk: TradeService.getRisk($scope.commodityNo),
		quote: StockService.getFuturesQuote($scope.commodityNo)
	}).then(function (res) {
		var riskData = res.risk.data,
			quoteData = res.quote.data;
		if (riskData.code == 100 && quoteData.code == 100) {
			processQuoteData(quoteData.data);
			init(riskData.data);
			$scope.switchPanel('sline');
		} else {
			if (riskData.code != 100) {
				X.tip(riskData['resultMsg']);
			} else if (quoteData.code != 100) {
				X.tip(quoteData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	$scope.switchPanel = function (type) {
		$scope.currType = type;
		if (type == 'sline' && !sChart) {
			getFuturesSline();
		} else if (type == 'tline' && !tChart) {
			drawTick();
		} else if (type == 'kline' && !kChart) {
			getFuturesKline();
		}
	};

	function init(data) {
		var serverTime = data['nowTime'];
		var risk = JSON.parse(data.strRisk);
		//X.log(risk);
		isTrade = risk['isTrade'].value == '1';
		//配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
		var holiday = SystemService.parseHoliday(risk['holiday'].value);
		var tradeTime = SystemService.parsePeriod(risk['tradingTimeLimit'].value);
		var quoteTime = SystemService.parsePeriod(risk['quoteTime'].value);
		SystemService.setCurrentTime(serverTime);
		SystemService.setCurrentCurrencyType('USD');
		SystemService.setHoliday(holiday);
		SystemService.setTradePeriod(tradeTime);
		SystemService.setQuotePeriod(quoteTime, $scope.commodityNo);

		getFuturesQuote(true);
		X.engine.addTask(getFuturesQuote, 500);
		X.engine.start();
	}

	function resize() {
		var els = [
			'#sline-wrap-' + $scope.uuid,
			'#kline-wrap-' + $scope.uuid,
			'#tline-wrap-' + $scope.uuid
		];
		var height = $(window).height();
		els.forEach(function (id) {
			//var top = $(id).offset().top;
			var top = 223;//上面获取分时图的上偏移，由于SPA切换的时候DOM会出现模板重叠导致top计算出现错误，因此用固定值计算
			var h = height - top - 103 - 5;
			$(id).height(h);
		});
	}

	function getFuturesSline() {
		StockService.getFuturesSline($scope.commodityNo).then(function (res) {
			var sLineData = res.data;
			if (sLineData.code == 100) {
				drawSline(sLineData.data);
			} else {
				X.tip(sLineData['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	function getFuturesKline() {
		StockService.getFuturesKline($scope.commodityNo).then(function (res) {
			var kLineData = res.data;
			if (kLineData.code == 100) {
				drawKline(kLineData.data)
			} else {
				X.tip(kLineData['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	function drawSline(sLineDataStr) {
		resize();
		if (!QUOTE_DATA)return;
		var slineData = sLineDataStr.split(';');
		var data = {}, lastTime;
		slineData.forEach(function (str) {
			var arr = str.split(',');
			lastTime = X.formatDate(X.toInt(arr[0]), 'hm') - 0;
			data[lastTime] = {
				current: X.toFloat(arr[1]),
				volume: 0,
				time: lastTime
			};
		});

		sChart = new X.Sline(chartOpts['sline'][$scope.commodityNo]);
		sChart.draw({
			data: data,
			close: X.toFloat(QUOTE_DATA['yesterdayPrice']),
			high: X.toFloat(QUOTE_DATA['highPrice']),
			low: X.toFloat(QUOTE_DATA['lowPrice']),
			quoteTime: lastTime,
			code: $scope.commodityNo,
			period: SystemService.getRealPeriod($scope.commodityNo, lastTime),
			isIntl: isIntl($scope.commodityNo)
		});
	}

	function drawKline(dataStr) {
		var klineData = dataStr.split(';');
		//后台给的数据是反的(┬＿┬)
		klineData.reverse();
		var data = [];
		klineData.forEach(function (str) {
			//时间+成交量+最高价+最低价+开盘价+最新价
			var arr = str.split(',');
			var o = {
				time: X.formatDate(arr[0] - 0, 'YMD'),
				open: X.toFloat(arr[4]),
				//close: X.toFloat(arr[4]),
				high: X.toFloat(arr[2]),
				low: X.toFloat(arr[3]),
				price: X.toFloat(arr[5])
			};
			data.push(o);
		});
		kChart = new X.Kline(chartOpts['kline'][$scope.commodityNo]);
		kChart.draw(data);
		CACHE_KLINE = data;
	}

	function drawTick() {
		tChart = new X.Tick(chartOpts['tline'][$scope.commodityNo]);
		tChart.draw({
			time: QUOTE_DATA.time,
			price: X.toFloat(QUOTE_DATA.newPrice)
		});
	}

	function perDrawSline(data) {
		var o = {
			current: X.toFloat(data['newPrice']),
			volume: 0,
			time: X.formatDate(data.time, 'hm') - 0
		};

		sChart && sChart.perDraw(o, {
			close: X.toFloat(data['yesterdayPrice']),
			high: X.toFloat(data['highPrice']),
			low: X.toFloat(data['lowPrice']),
			quoteTime: o.time,
			code: $scope.commodityNo,
			period: SystemService.getRealPeriod($scope.commodityNo, o.time),
			isIntl: isIntl($scope.commodityNo)
		});
	}

	//更新最新K线信息
	function perDrawKline(data) {
		// 累加和更新数据//如果股票停牌则不放到K线数据中PS：其实是可以看，接口数据错误所以先不加
		if (data['newPrice'] == 0 || !CACHE_KLINE || !CACHE_KLINE.length) {
			return;
		}
		var o = {
			time: X.formatDate(data.time, 'YMD'),
			open: data['openPrice'],
			close: data['yesterdayPrice'],
			high: data['highPrice'],
			low: data['lowPrice'],
			price: data['newPrice']// 即时数据，使用当前价格
		};
		var last = CACHE_KLINE[CACHE_KLINE.length - 1];

		if (last.time === o.time) {
			CACHE_KLINE[CACHE_KLINE.length - 1] = o;
		} else {
			CACHE_KLINE.push(o);
		}

		kChart && kChart.draw(CACHE_KLINE);
	}

	function perDrawTick(data) {
		tChart && tChart.draw({
			time: data.time,
			price: X.toFloat(data.newPrice)
		});
	}

	function getFuturesQuote(flag) {
		//判断是否是在交易时间段内
		//PS要把时间段的提示绑定到页面上，因为作用域的$scope问题，当赋值完成以后必须要在执行angular的原生方法激活数据的双向绑定否则新赋值不能双向绑定到页面
		if (isTrade) {
			$scope.isInPeriod = SystemService.isInPeriod($scope.commodityNo, 'trade');
			if ($scope.isInPeriod) {
				$scope.tips = '本时段' + SystemService.getTipsForTradeStopTime($scope.commodityNo);
			} else {
				$scope.tips = '已休市，' + SystemService.getTipsForNextTime($scope.commodityNo);
			}
		} else {
			$scope.isInPeriod = false;
			$scope.tips = '暂停交易';
		}
		var isInQuoteTime = SystemService.isInPeriod($scope.commodityNo, 'quote');

		if (!flag && !isInQuoteTime) {
			$scope.$apply();
		}

		//判断是否是在行情时间段内
		if (isLoadFuturesQuote && isInQuoteTime) {
			isLoadFuturesQuote = false;
			StockService.getFuturesQuote($scope.commodityNo).then(function (res) {
				isLoadFuturesQuote = true;
				var data = res.data;
				if (data.code == 100) {
					processQuoteData(data.data);
				} else {
					X.tip(data['resultMsg']);
				}
				X.loading.hide();
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}
	}

	function processQuoteData(data) {
		var futureArr;
		if (data) {
			futureArr = data.split(',');
			//合约编号, 时间,开盘价,昨收,涨跌值,涨跌幅,最高,最低,总手,最新价,对手买价,对手卖价,买量,卖量
			var baseNum = 50, buyNum = X.toInt(futureArr[12]), sellNum = X.toInt(futureArr[13]),
				buyNumRate = buyNum / baseNum * 100, sellNumRate = sellNum / baseNum * 100;
			if (buyNumRate > 100) {
				buyNumRate = 100;
			}
			if (sellNumRate > 100) {
				sellNumRate = 100;
			}
			QUOTE_DATA = {
				contractNo: futureArr[0],
				time: futureArr[1] - 0,
				openPrice: futureArr[2],
				yesterdayPrice: futureArr[3],
				changeValue: futureArr[4],
				changeQuote: futureArr[5],
				highPrice: futureArr[6],
				lowPrice: futureArr[7],
				total: X.sketchNumber(futureArr[8], 2),
				newPrice: futureArr[9],
				buyPrice: futureArr[10],
				sellPrice: futureArr[11],
				buyNum: buyNum,
				sellNum: sellNum,
				buyNumRate: buyNumRate,
				sellNumRate: sellNumRate
			};
			$scope.futureInfo = QUOTE_DATA;

			perDrawTick(QUOTE_DATA);
			perDrawSline(QUOTE_DATA);
			perDrawKline(QUOTE_DATA);
		}
	}

	function isIntl(commNo) {
		return commNo == 'GC' || commNo == 'CL' || commNo == 'SI' || commNo == 'DAX';
	}

	$scope.$on('$destroy', function () {
		X.engine.destroy();
	});
});
//二级点买页面
myControllers.controller('OneYuanTradeBuyCtrl', function ($scope, $q, $routeParams, $location, StockService, TradeService, UserService, PacketService, SystemService) {
	$scope.buyChange = $routeParams.buyChange || 'buy';

	$scope.commodityNo = 'MHI';
	$scope.commodityTitle = '小恒指';
	$scope.type = '2';
	$scope.buyChange = $routeParams.buyChange || 'buy';

	var isLoadFuturesQuote = true,
		isTrade = false;
	$scope.tips = '';
	$scope.isInperiod = false;


	$scope.principal = 0;//保证金
	$scope.serviceMoney = 0;//所选交易的交易综合费
	$scope.selectedLowMoney = 0;
	$scope.selectedCount = 0;
	$scope.futureInfo = {};
	$scope.experienceQuitGainValue = 0;//一元实盘的止盈金额
	$scope.experienceQuitCloseRatio = 0;//一元实盘的止损点数

	X.loading.show();
	$q.all({
		userInfo: UserService.getUserInfo(),
		getRiskInfo: TradeService.getRisk($scope.commodityNo),
		quote: StockService.getFuturesQuote($scope.commodityNo),
		packet: PacketService.getPacketFundInfoData(),
	}).then(function (res) {
		var userInfoData = res.userInfo.data,
			riskData = res.getRiskInfo.data,
			packetData = res.packet.data,
			quoteData = res.quote.data;
		if (userInfoData.code == 100 && riskData.code == 100 && quoteData.code == 100 && packetData.code == 100) {
			$scope.userInfo = userInfoData.data;
			$scope.tipBalance = packetData.data.tipBalance;
			if ($scope.tipBalance == 0) {
				$scope.useTip = false;
			}
			init(riskData.data);
			futureQuote(quoteData.data);
			if (!$scope.userInfo['named']) {
				initValidate();
			} else {
				//向本地条件添加合约号
				showNewContractNo($scope.contractNo);
			}
		} else {
			if (userInfoData.code != 100) {
				X.tip(userInfoData['resultMsg']);
			} else if (riskData.code != 100) {
				X.tip(riskData['resultMsg']);
			}
		}
		X.loading.hide();
	}).catch(function () {
		X.tip('服务器请求异常');
	});

	//提示合约更新
	function showNewContractNo(contractNo) {
		var storage = window.localStorage, CONTRACTNO = 'CONTRACTNO', contractNoStr = storage.getItem(CONTRACTNO) || '';
		if (contractNoStr == '') {
			X.dialog.alert($scope.commodityTitle + '合约已更新为' + contractNo);
			storage.setItem(CONTRACTNO, contractNo);
			return;
		}
		var conTractNoArr = contractNoStr.split(',');
		if (conTractNoArr.indexOf(contractNo) == -1) {
			X.dialog.alert($scope.commodityTitle + '合约已更新为' + contractNo);
			conTractNoArr.push(contractNo);
			storage.setItem(CONTRACTNO, conTractNoArr);
		}
	}

	//发起交易
	$scope.toTrade = function () {
		var needMoney = 1,
			tradeT = SystemService.beyondTradeTimeTips($scope.commodityNo);
		/*//如果使用红包抵扣，从所需余额中减去红包部分
		 if ($scope.useTip) {
		 needMoney -= $scope.usTipBalance;
		 }*/

		if (!isTrade) {
			X.dialog.alert('暂停交易');
			return false;
		}

		//判断是否交割期间
		if ($scope.futureInfo.contractNo != $scope.contractNo) {
			X.dialog.alert('合约交割变更期间，无法发起策略');
			return false;
		}

		//判断是否是在交易时间段内
		var isInPeriod = SystemService.isInPeriod($scope.commodityNo, 'trade');
		if (!isInPeriod) {
			X.dialog.alert(tradeT);
			return false;
		}

		if ($scope.type != '1') {
			//判断余额是否充足
			if ($scope.balance < needMoney) {//余额不足
				X.dialog.confirm('当前余额不足，<br>请充值后再发起策略。', {
					sureBtn: '去充值', notify: function (nt) {
						if (nt == 1) {
							$scope.$apply(function () {
								$location.url('/payType?backURL=/oneYuanTradeBuy/' + $scope.buyChange);
							})
						}
					}
				});
				return false;
			}
		}

		trade();
	};

	//初始化风控接口数据
	function init(data) {
		$scope.balance = data['balance'];
		$scope.token = data['token'];
		var newTime = data['nowTime'];
		var risk = JSON.parse(data['strRisk']);
		var tradeTimeStr = risk['tradingTimeLimit'].value;//交易时间
		//获取每个具体时间
		$scope.commodityTitle = risk['futuresName'].value;//商品名称
		$scope.contractNo = risk['contractCode'].value;//合约代码编号 MHI1606
		$scope.experienceQuitGainValue = risk['experienceQuitGainValue'].value;
		$scope.experienceQuitCloseRatio = risk['experienceQuitCloseRatio'].value;
		// $scope.serviceCharge = risk['serviceCharge'].value;//服务费
		$scope.value = risk['contractValue'].value; //最小波动价值
		// var lossCount = risk['quitCloseRatio'].value.split(',');//止损线点数 20,40,60,80,100
		// $scope.lossCountLen = [];
		/*for (var i = 0; i < lossCount.length; i++) {
		 $scope.lossCountLen.push(X.toInt(lossCount[i]));
		 }*/
		// $scope.lossScale = risk['lossRatio'].value;  // 止损比例
		$scope.exchangeRate = risk['exchangeRate'].value; // 汇率

		// //存在参数时
		// if (amount && quitCloseRatio) {
		//     if ($scope.tradeNumList.indexOf(amount) != -1 && lossCount.indexOf(quitCloseRatio) != -1) {
		//         $scope.tradeIndex = $scope.tradeNumList.indexOf(amount);
		//         $scope.tradeNumber = amount;
		//         $scope.lowIndex = lossCount.indexOf(quitCloseRatio);
		//     }
		// }

		var holiday = SystemService.parseHoliday(risk['holiday'].value);
		var tradeTime = SystemService.parsePeriod(tradeTimeStr);
		var quoteTime = SystemService.parsePeriod(risk['quoteTime'].value);
		isTrade = risk['isTrade'].value == '1';
		SystemService.setCurrentTime(newTime);
		SystemService.setCurrentCurrencyType('USD');
		SystemService.setHoliday(holiday);
		SystemService.setTradePeriod(tradeTime);
		SystemService.setQuotePeriod(quoteTime, $scope.commodityNo);
		/*$scope.tradeTime = tradeTime;//将service处理好的交易时间数组放入$scope.tradeTime，不用再处理一遍*/

		getLossMoney();
		getFutures(true);
		X.engine.addTask(getFutures, 500);
		X.engine.start();
	}

	//进行实名判断
	function initValidate() {
		if ($scope.type != '1') {
			//判断是否进行实名认证
			X.dialog.confirm('您还未实名认证，请先实名认证', {
				notify: function (nt) {
					if (nt == 1) {
						$location.url('/identification?backURL=/oneYuanTradeBuy/' + $scope.buyChange);
					}
					if (nt == 0) {
						$location.url('/oneYuanTrade');
					}
				}
			});
		}
	}

	//提示合约更新
	function showNewContractNo(contractNo) {
		var storage = window.localStorage, CONTRACTNO = 'CONTRACTNO', contractNoStr = storage.getItem(CONTRACTNO) || '';
		if (contractNoStr == '') {
			X.dialog.alert($scope.commodityTitle + '合约已更新为' + contractNo);
			storage.setItem(CONTRACTNO, contractNo);
			return;
		}
		var conTractNoArr = contractNoStr.split(',');
		if (conTractNoArr.indexOf(contractNo) == -1) {
			X.dialog.alert($scope.commodityTitle + '合约已更新为' + contractNo);
			conTractNoArr.push(contractNo);
			storage.setItem(CONTRACTNO, conTractNoArr);
		}
	}

	//判断时间
	function getFutures(flag) {
		//判断是否是在交易时间段内
		if (isTrade) {
			$scope.isInPeriod = SystemService.isInPeriod($scope.commodityNo, 'trade');
			if ($scope.isInPeriod) {
				$scope.tips = SystemService.getTipsForTradeStopTime($scope.commodityNo);
			} else {
				$scope.tips = SystemService.getTipsForNextTime($scope.commodityNo);
			}
		} else {
			$scope.isInPeriod = false;
			$scope.tips = '暂停交易';
		}

		var isInQuoteTime = SystemService.isInPeriod($scope.commodityNo, 'quote');
		if (!flag && !isInQuoteTime) {
			$scope.$apply();
		}
		//判断是否是在行情时间段内
		if (isLoadFuturesQuote && isInQuoteTime) {
			isLoadFuturesQuote = false;
			StockService.getFuturesQuote($scope.commodityNo).then(function (res) {
				isLoadFuturesQuote = true;
				var data = res.data;
				if (data.code == 100) {
					futureQuote(data.data);
				} else {
					X.tip(data['resultMsg']);
				}
				X.loading.hide();
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}
	}

	//初始化买卖价
	function futureQuote(data) {
		if (!data) {
			return;
		}
		var futureArr = data.split(',');
		//合约编号, 时间,开盘价,昨收,涨跌值,涨跌幅,最高,最低,总手,最新价,对手买价,对手卖价,买量,卖量
		$scope.futureInfo = {
			contractNo: futureArr[0],
			buyPrice: futureArr[10],
			sellPrice: futureArr[11]
		};
	}

	$scope.$on('$destroy', function () {
		X.engine.destroy();
	});

	//获取止损金额和交易综合费
	function getLossMoney() {
		$scope.lowMoney = Math.round($scope.experienceQuitCloseRatio * $scope.value * $scope.exchangeRate * 100) / 100 | 0;
	}

	function trade() {
		var direction = $scope.buyChange == "sell" ? "S" : "B";

		var postData = {
			commodityNo: $scope.futureInfo.contractNo,//获取行情返回的合约编号，后端判断是否交割
			type: $scope.type,
			useTip: false,
			amount: 1,
			direction: direction,
			lossPrincipal: 1,
			gainPrincipal: $scope.experienceQuitGainValue,
			serviceCharge: 0,
			contractCode: $scope.contractNo,
			quitLoss: $scope.lowMoney,
			quitGain: $scope.experienceQuitGainValue,
			quitCloseRatio: $scope.experienceQuitCloseRatio,
			token: $scope.token
		};

		X.loading.show();
		TradeService.createFuturesStrategy(postData).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				replaceToken(data);
				X.dialog.alert('点买成功', {
					notify: function () {
						$location.url('/oneYuanTradeSell');
					}
				});

				//埋点：交易
				if ($scope.type == '2') {
					zhuge.track('交易', {
						名称: $scope.commodityNo
					});
				}
			} else {
				replaceToken(data);
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	//当再次点击点买时，替换掉之前的token值
	function replaceToken(data) {
		var token = data.data;
		$scope.token = token.token;
	}
});
//点卖页面
myControllers.controller('OneYuanTradeSellCtrl', function ($scope, $q, $routeParams, $location, TradeService, SystemService, StockService) {
	$scope.commodityNo = "MHI";
	$scope.type = "3";
	$scope.commodityTitles = {
		MHI: '小恒指'
	};
	$scope.futureInfo = {
		commodityTitle: $scope.commodityTitles[$scope.commodityNo]
	};

	// 行情相关信息       当前策略                    当前买价
	var options = {}, currentSaleFutures = [], currentPrices = {};
	//初始化弹窗ID
	$scope.currCommoID = 0;
	$scope.sellOutID = 0;
	$scope.trade = {};
	var tradeIsLoad = false;
	// $scope.sellAllID = 0;
	var MHIRiskData = {};
	var willSaleTradeID;//要卖出的方案ID
	$scope.saleList = [];    //策略列表
	// $scope.total = 0;    //总盈亏
	$q.all({//获取风控数据
		MHIRisk: TradeService.getRisk('MHI')
	}).then(function (res) {
		MHIRiskData = res.MHIRisk.data;
		if (MHIRiskData.code == 100) {
			init(MHIRiskData.data['strRisk']);//取到strRisk的数据并转换JSON为js对象
		} else {
			X.tip('系统错误');
		}
	}).catch(function () {
		X.tip('服务器请求异常');
	});


	//初始化配置参数数据，开启定时任务
	function init(MHIRisk) {
		var mhiRisk = JSON.parse(MHIRisk);
		var MHICommNo = getCommNo(mhiRisk['contractCode'].value);
		options[MHICommNo] = {
			symbol: 'HK$',
			commodityNo: MHICommNo,
			contractValue: X.toFloat(mhiRisk['contractValue'].value),
			exchangeRate: X.toFloat(mhiRisk['exchangeRate'].value),
			fluctuationValue: X.toFloat(mhiRisk['fluctuationValue'].value),
			isTrade: mhiRisk['isTrade'].value
		};

		getFuturesSale();
		X.engine.addTask(getFuturesSale, 5000);
		//持仓
		X.engine.addTask(getFuturesQuote, 1000);//行情
		X.engine.start();

	}

	//转换策略代号如CL1606 -->CL
	function getCommNo(commNo) {
		return commNo.replace(/\d+/, '');
	}

	//初始化risk数据，得到时候交易时间和holiday等参数
	function initRisk(data, commo) {
		var serverTime = data['nowTime'];
		var risk = JSON.parse(data['strRisk']);
		var holiday = SystemService.parseHoliday(risk['holiday'].value);
		var tradeTime = SystemService.parsePeriod(risk['tradingTimeLimit'].value);
		var quoteTime = SystemService.parsePeriod(risk['quoteTime'].value);
		//配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
		var isTrade = risk['isTrade'].value == '1';
		SystemService.setCurrentTime(serverTime);
		SystemService.setCurrentCurrencyType('USD');
		SystemService.setHoliday(holiday);
		SystemService.setTradePeriod(tradeTime);
		SystemService.setQuotePeriod(quoteTime, commo);
	}

	//查询持仓数据
	function getFuturesSale() {
		if (tradeIsLoad == false) {
			TradeService.getSaleFutures($scope.type).then(function (res) {
				var tradeData = res.data;
				if (tradeData.code == 100) {
					if (tradeData.data.length == 0) {
						tradeIsLoad = true;
					}
					currentSaleFutures = tradeData.data;
					//保证查询持仓同时能获取行情数据
					getFuturesQuote();
					process();//此时已得到$scope.trade
					$scope.allIDsArr = [];//所有ID
					var currCommo = $scope.trade;
					if ($scope.trade.id) {
						var direction = currCommo['direction'];//交易方向（看张看跌）
						var status = currCommo['status'];//当前状态：持仓，正在卖出，正在买入
						var commoNo = currCommo['commodityNo'];//当前策略号
						var isTrade = options[commoNo]['isTrade'] == '1';//判断是否在交易时间内（可手动开关的）
					}
					if (isTrade) {
						var isInPeriod = false;
						initRisk(MHIRiskData.data, commoNo);
						isInPeriod = SystemService.isInPeriod(commoNo, 'trade')
						if (isInPeriod && status == 4) {
							$scope.allIDsArr.push(currCommo['id']);
						}
					}

				} else {
					X.tip(tradeData['resultMsg']);
				}
			}).catch(function () {
				X.tip('服务器请求异常');
			});
		}
	}

	//查询行情数据
	function getFuturesQuote() {
		//是否在交易时段
		if (!currentSaleFutures[0])return;
		var commNoStr = currentSaleFutures[0]['commodityNo'];
		StockService.getFuturesSimpleQuote(commNoStr).then(function (res) {
			var quoteData = res.data, quoteDataArray;
			if (quoteData.code == 100) {
				quoteDataArray = quoteData.data;
				//解析行情 ：  遍历行情，并将与行情相对应的当前买价与行情对应
				parseQuote(commNoStr, quoteDataArray);
				process();
			} else {
				X.tip(quoteData['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	/*//查询持仓中对应的策略代码'HSI','GC','CL'(可能并不会都存在)
	 function getSaleCommNo(data) {
	 var commNos = [];
	 data.forEach(function (commObj) {
	 var commodityNo = commObj['commodityNo'];
	 commNos.indexOf(commodityNo) == -1 && commNos.push(commodityNo);//如果当前commoNos中没有commodityNo，则推入当前commodityNo
	 });
	 return commNos;
	 }*/

	//解析行情 ：  遍历行情，并将与行情相对应的当前买价与行情对应
	function parseQuote(commNoStr, quoteDataArray) {
		if (quoteDataArray != '' && commNoStr != '') {
			var quoteDataArr = quoteDataArray.split(',');
			//与行情相对应的当前卖价
			currentPrices[commNoStr] = quoteDataArr[2];
		}
	}

	//根据持仓获得的数据进行配置成需要的参数，并得到策略列表$scope.saleList
	function process() {
		if (!currentSaleFutures[0]) {
			$scope.trade = {}
		} else {
			var commInfo = currentSaleFutures[0];
			var commNo = commInfo['commodityNo'];
			var currOptions = options[commNo];
			var buyPriceDeal = commInfo['buyPriceDeal'];
			var price = X.toFloat(currentPrices[commNo]);
			var direction = commInfo['direction'] == 'B' ? 1 : -1;
			var amount = commInfo['amount'];
			var symbol = currOptions.symbol;
			var status = commInfo['status'];

			//当前盈亏
			var currMoney = 0;
			var rmb = 0;
			//如果买价从行情获取到
			if (buyPriceDeal) {//                                          最小波动点数                              波动单价            涨跌方向
				currMoney = Math.round((price - buyPriceDeal) / currOptions.fluctuationValue * amount * currOptions.contractValue * direction * 100) / 100;
				//                                            汇率
				rmb = Math.round(currMoney * currOptions.exchangeRate * 100) / 100;
			}
			//商品数据初始化
			$scope.trade = {
				id: commInfo['id'],//策略ID
				amount: amount,//手数
				commodityName: commInfo['commodityName'],//策略名字
				commodityNo: commNo,//策略号
				buyPriceDeal: buyPriceDeal,//买入价
				contractNo: commInfo['contractNo'],
				dealTime: commInfo['dealTime'],//结算时间
				direction: direction,//交易方向：看掌柜看跌
				gainPrincipal: commInfo['gainPrincipal'],//最大止盈线
				lossPrincipal: commInfo['lossPrincipal'],//合约保证金
				quitLoss: commInfo['quitLoss'],//当前止损线
				quitGain: commInfo['quitGain'],//当前止盈线
				status: status,//当前策略状态
				price: currentPrices[commNo],//当前价
				currMoney: Math.round(currMoney * 100) / 100,//当前策略盈亏
				symbol: symbol,//货币符 ： $ HK$
				rmb: rmb,//当前盈亏转换为人名币后的金额
				quitCloseRatio: commInfo['quitCloseRatio']//点数
			};
		}
		;

	}

	//弹窗交互


	//弹出平仓交易窗口                  当前ID    策略号     交易方向        止损线点数       手数      状态
	$scope.sellOutDialog = function (tradeID, commo, tradeDirection, tradeCloseRadio, amount, status) {
		willSaleTradeID = tradeID;
		TradeService.getRisk(commo).then(function (res) {
			var riskData = res.data;
			if (riskData.code == 100) {
				var riskStr = riskData.data['strRisk'];
				var risk = JSON.parse(riskStr);
				var isTrade = risk['isTrade'].value == '1';//判断是否暂停交易
				initRisk(riskData.data, commo);//得到节假日，是否暂停交易等信息
				var isInPeriod = SystemService.isInPeriod(commo, 'trade');
				var tradeT = SystemService.beyondTradeTimeTips(commo);
				if (isTrade) {
					if (!isInPeriod) {
						X.dialog.alert(tradeT);
					}
					else {
						$scope.currCommoID = 1;
					}
				} else {
					X.dialog.alert('暂停交易');
				}
			}
		}).catch(function () {
			X.tip('服务器异常');
		});
		$scope.status = status;
		$scope.amount = amount;
	};


	$scope.choiceStatus = 0;//根据状态来判断选择了即时平仓还是马上看跌，0：即时平仓，1：即时平仓，马上看跌/看涨
	$scope.chooseSellOut = function () {
		$scope.choiceStatus = 0;
	};

	//平仓
	$scope.sellCurrCommodity = function () {
		$scope.closeFeaturesData = [];
		//根据选择的卖出种类以及笔数来选择全部/看涨/看跌IDs,若没有选择的是全部平仓，则willSaleTradeID为当前单条策略的ID
		if ($scope.currCommoID == 1) {//当全部平仓窗口弹出时，才对willSaleTradeID进行赋值操作。此前bug：当看涨IDs提交后，willSaleTradeID = [],当点击单个平仓后allSellStatus还等于1，但是willSaleTradeID是空数组，所以会出现点击单个平仓时出现策略ID为空。
			willSaleTradeID = $scope.allIDsArr;
		}
		$scope.sellAllID = 0;

		if (!willSaleTradeID) {
			X.tip('策略ID不能为空');
			return;
		}
		X.loading.show();
		TradeService.getCloseFutures(willSaleTradeID, 2).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				tradeIsLoad = false;
				getFuturesSale();
				var dataInfoArr = data.data.split(';');
				var sucNum = X.toFloat(dataInfoArr[0]);
				if ($scope.choiceStatus == 0) {
					if (sucNum == 1) {
						X.dialog.alert('委托卖出成功');
						tradeIsLoad = false;
						getFuturesSale();
						$scope.currCommoID = 0;
					} else {
						X.dialog.alert('委托卖出失败');
						$scope.currCommoID = 0;
					}
				}
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	$scope.cancelDialog = function () {
		if ($scope.currCommoID == 1) {
			$scope.currCommoID = 0;
		}
	};

	$scope.$on('$destroy', function () {
		X.engine.destroy();
	});
});
//结算页面
myControllers.controller('OneYuanTradeResultCtrl', function ($scope, $q, $routeParams, TradeService) {
	$scope.commodityNo = "MHI";
	$scope.type = "3";
	$scope.commodityTitles = {
		MHI: '小恒指'
	};
	$scope.futureInfo = {
		commodityTitle: $scope.commodityTitles[$scope.commodityNo]
	};

	var pageSize = 10;//一页显示的条数
	$scope.settleDataList = [];
	$scope.currPage = 1;//当前页码
	$scope.totalPage = 1;//总页数

	$scope.getSettleList = function (page) {
		X.loading.show();
		TradeService.getTradeResult(page, pageSize, $scope.type).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				var list = data.data['dataList'];
				$scope.currPage = data.data['pageIndex'];
				$scope.totalPage = data.data['totalPage'];
				if (page == 1) {
					$scope.settleDataList = list;
				} else {
					$scope.settleDataList = $scope.settleDataList.concat(list);
				}
			} else {
				X.tip(data['resultMsg']);
			}
			X.loading.hide();
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};
	$scope.getSettleList($scope.currPage);//取得第一页

	//显示当前选择的结算详情
	$scope.currTrade = 0;
	$scope.showCurrTradeDetail = function (tradeId) {
		if ($scope.currTrade == tradeId) {
			$scope.currTrade = 0;
		} else {
			$scope.currTrade = tradeId;
		}
	};
});


//-------------------------------------

//发现
myControllers.controller('DiscoverCtrl', function ($scope, $sce, NoticeService) {
	var page, pageSize = 10, id = 0;
	$scope.currPage = 1;
	$scope.totalPage = 1;
	$scope.currNoticeIndex = 0;

	$scope.getNoticeList = function (page) {
		NoticeService.getNotices(page, pageSize).then(function (res) {
			var data = res.data,
				noticeList,
				noticeData;
			noticeData = data.data;
			$scope.currPage = data.data['pageIndex'];
			$scope.totalPage = data.data['totalPage'];
			if (data.code == 100) {
				noticeList = data.data['items'];
				if (page == 1) {
					$scope.noticeList = noticeList;
				} else {
					$scope.noticeList = $scope.noticeList.concat(noticeList);
				}
			} else {
				X.tip(data['resultMsg']);
			}
			for (var i in $scope.noticeList) {
				$scope.noticeList[i]['noticeContent'] = $sce.trustAsHtml("<p style='word-break: break-all'>" + $scope.noticeList[i].noticeContent + "</p>")
				$scope.noticeList[i]['id'] = id;
				id++;
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	};

	$scope.getNoticeList($scope.currPage);

	//展示公告详情
	$scope.showCurrNotice = function (currId) {
		if ($scope.currNoticeIndex == currId) {
			$scope.currNoticeIndex = -1;
		} else {
			$scope.currNoticeIndex = currId;
		}
	}
});

//排行榜(昨日/上月)
myControllers.controller('DayGainListCtrl', function ($scope, $sce, $location, RankService) {
	var type = $location.search()['type'] || 'day';
	$scope.type = type;
	$scope.txtObj = {
		day: {
			title: '昨日盈利榜',
			gainTxt: '盈利(元)'
		},
		month: {
			title: '佣金收入榜',
			gainTxt: '总收入(元)'
		}
	};
	X.log(type);
	$scope.rankList = [];
	if (type == 'day') {
		getRankData(type);
	} else if (type == 'month') {
		getRankData(type);
	}

	function getRankData(type) {
		RankService.getRank(type).then(function (res) {
			var data = res.data;
			if (data.code == 100) {
				$scope.rankList = data.data;
			} else {
				X.tip(data['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		})
	}
});

//获取模拟币
myControllers.controller('GetSimCoinCtrl', function ($scope,$q, $sce,UserService,ExtensionService) {
	$scope.showMA = false;
	$scope.showMAPic = function () {
		$scope.showMA = !$scope.showMA;
	};
	$scope.simBalance = 0;
	var sessionID = window.sessionStorage['sessionID'];

	sessionID && getSimBalance();

	function getSimBalance(){
		$q.all({
			sim:UserService.getSimBalance(),
			extensionInfo: ExtensionService.getExtensionInfoData()
		}).then(function (res) {
			var simData = res.sim.data,extensionData = res.extensionInfo.data;
			if(simData.code == 100 && extensionData.code == 100){
				var coinArr = simData.data.split(';')
				$scope.simBalance = coinArr[0];
				$scope.simPart = coinArr[1];
				$scope.userCount = extensionData.data['userCount'];
				$scope.MAPic = '/home/generalize/getQRcode.json?device=1';
				$scope.generalizeUrl =  extensionData.data['generalizeUrl'];
				X.clipboard.init();
				$('.copy-target').hide();
			}
			else{
				X.tip(data['resultMsg']);
			}
		}).catch(function () {
			X.tip('服务器请求异常');
		});
	}

	var windowHeight = window.screen.height;
	if(windowHeight - 130 - 50 - 280 - 24 - 18 - 30 - 36 - 30 - 36 - 30 - 60 > 0){
		$('.coin-footer')[0].style.height = windowHeight - 130 - 50 - 280 - 24 - 18 - 30 + 'px';
	}
	X.log(windowHeight - 130 - 50 - 280 - 24 - 18 - 30 - 36 - 30 - 36 - 30, windowHeight);
});