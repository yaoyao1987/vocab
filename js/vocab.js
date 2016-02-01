define(function(require, exports, module) {
	var $ = require('jquery'),
		move = require('move.min');
	function Vocab(container,data){
		this.container = $(container);
		this.question = data;
		this.shareMessage = '';
		this._init();
		this._initEvent();
	}
	module.exports = Vocab;
	
	//页面初始化
	Vocab.prototype._init = function(){
		var container = this.container,
			data = this.question;
		//词汇
		var temp = '';
		$.each(data,function(key,val){
			var _answer,_data=[],optionArray = [];
			temp += '<div id="word-'+key+'" class="definition hide">';
			if(key % 2 === 0){
				temp += '<p class="vocab-word">'+val["name"]+' <font class="f18">的意思？</font></p>';
				_data = data[key]["mean"];
				_answer = val["answer1"];
			}else{
				temp += '<p class="vocab-word">'+val["name"]+' <font class="f18">的近义词？</font></p>';
				_data = data[key]["synonym"];
				_answer = val["answer2"];
			}
			$.each(_data,function(k,v){
				var template = '<label class="word" value="'+v["id"]+'" rank="'+val["id"]+'" answer="'+_answer+'">'+(k+1)+'.   '+v["name"]+'</label>';
				optionArray.push(template);
			});

			temp += optionArray.join("");
			temp += '</div>';
		});
		container.append(temp);
	};
	//初始化事件
	Vocab.prototype._initEvent = function(){
		var self = this,correctCount=0,incorrectCount=0;
		//进入做题页面
		$("#btn-start").click(function(){
			move('#btn-start').set('box-shadow', '0 0 20px black').rotate(360).end();
			var height = $('#start').height();
			//1秒后向上隐藏start
			setTimeout(function() {
		        move('#start').to(0, -height).end(function() {
		            $('#start').hide();
		        });
		        self.hideOptionMenu();
		    },
		    1000);
		    $("#content").css("display","block").find("#vocab-con .definition").eq(0).show();
		});
		//做题
		$('.definition .word').on("click",function(){
			var $definition = $(this).parents('.definition');
            /*$definition.slideUp();*/
			var answer_id = $(this).attr('answer'),choice_id = $(this).attr('value'),
				right_answer = $.trim($definition.find('label.'+answer_id).text()).replace(/^\d\./,'');
			if(answer_id == choice_id){
				correctCount+=1;
			}else{
				incorrectCount +=1;
			}
			var correctProcess = Math.ceil(correctCount / 50 * 100),incorrectProcess = Math.floor(incorrectCount / 50 * 100),
				undoCount = 50 - (correctCount + incorrectCount),undoProcess = 100 - (correctProcess + incorrectProcess);

			correctCount && $("#vocab-progress").find("#correct").text(correctCount).css("width",correctProcess+'%');
			incorrectCount && $("#vocab-progress").find("#incorrect").text(incorrectCount).css("width",incorrectProcess+'%');
			undoCount && $("#vocab-progress").find(".bar-undo").text(undoCount).css("width",undoProcess+'%');
			
			if (undoCount == 0) {
				//正确率
				var accuracy = correctCount/50;
				var j = setTimeout(function() {
		            self.uploadData(accuracy);
		            clearTimeout(j);
		        }, 1e3);
				/*$("#content").css("display","none");
				$('#waiting').show();
				move('#waiting').set('padding-top', 220).end();
				$.ajax({
					url: '/service/pub/test/toefl/read?correctRate='+accuracy,
					type: 'GET',
					dataType:"json",
					success: function(data) {
						if (data.status == 1) {
							var _data = data.data;
							//单词测试完毕，显示结果
							$("#waiting").hide();
							$("#result-container,#promotion-container").css("display","block");
							$("#score").text(_data.totalScore);
							$("#comment-info").text(_data.message);
							self.shareMessage = _data.forwardMessage;
							self.showOptionMenu();
						}
					}
				});*/
			}else{
				//下一题
				var l = setTimeout(function() {
					self.cardOut($definition);
			        /*var j = setTimeout(function() {
			            self.cardIn($definition.next());
			            clearTimeout(j);
			        }, 500);*/
			        clearTimeout(l);
			    }, 200);
			}
		});
		//当微信内置浏览器完成内部初始化后会触发WeixinJSBridgeReady事件。
        document.addEventListener('WeixinJSBridgeReady', function onBridgeReady() {
            // 分享到朋友圈
            WeixinJSBridge.on('menu:share:timeline', function(argv){
            	self.shareTimeline();
            });
        }, false);
	};
	//上传数据
	Vocab.prototype.uploadData = function(accuracy){
		var self = this;
		//loading
		$("#content").css("display","none");
		$('#waiting').show();
		move('#waiting').set('padding-top', 220).end();
		$.ajax({
			url: '/service/pub/test/toefl/read?correctRate='+accuracy,
			type: 'GET',
			dataType:"json",
			success: function(data) {
				if (data.status == 1) {
					var _data = data.data;
					//单词测试完毕，显示结果
					$("#waiting").hide();
					$("#result-container,#promotion-container").css("display","block");
					$("#score").text(_data.totalScore);
					$("#comment-info").text(_data.message);
					self.shareMessage = _data.forwardMessage;
					self.showOptionMenu();
				}
			}
		});
	};
	//单词条显示
	Vocab.prototype.cardIn = function(dom){
		move('#'+dom[0].id).set('margin-top', 0).duration(500).end();
	};
	//单词条消失
	Vocab.prototype.cardOut = function(dom){
		var self= this,height = $(document).height();
		move('#'+dom[0].id).to(0, -height).duration(300).end(function() {
	        dom.hide();
	        dom.next().css('margin-top', height).show();
	        var j = setTimeout(function() {
	            self.cardIn(dom.next());
	            clearTimeout(j);
	        }, 500);
	    });	    
	};
	//发送到朋友圈
	Vocab.prototype.shareTimeline = function() {
		var self=this,imgUrl = '../image/logo.png',lineLink = 'http://www.kentinew.com/web/pub/vocab/',shareTitle=self.shareMessage,desc="托福分数测验神器";
		shareTitle = shareTitle==""?"我发现了一个托福预测神器！快来测测吧":shareTitle;
		WeixinJSBridge.invoke('shareTimeline',{
                "img_url": imgUrl,
                "img_width": "336",
                "img_height": "335",
                "link": lineLink,
                "desc": desc,
                "title": shareTitle
            }, function(res) {
                   //_report('timeline', res.err_msg);
            });
	};
	//如果是微信浏览器，隐藏右上角按钮
	Vocab.prototype.hideOptionMenu = function(){
		if (typeof WeixinJSBridge != "undefined") {
			WeixinJSBridge.call('hideOptionMenu');
		}
	};
	//如果是微信浏览器，显示右上角按钮
	Vocab.prototype.showOptionMenu = function(){
		if (typeof WeixinJSBridge != "undefined") {
			WeixinJSBridge.call('showOptionMenu');
		};
	}
});