
/***********************
* Adobe Edge Animate Composition Actions
*
* Edit this file with caution, being careful to preserve 
* function signatures and comments starting with 'Edge' to maintain the 
* ability to interact with these actions from within Adobe Edge Animate
*
***********************/
(function($, Edge, compId){
var Composition = Edge.Composition, Symbol = Edge.Symbol; // aliases for commonly used Edge classes

    //Edge symbol: 'stage'
   (function(symbolName) {

    Symbol.bindElementAction(compId, symbolName, "document", "compositionReady", function(sym, e) {
    // insert code to be run when the composition is fully loaded here
    var speedControl = "idle";
    var gage_timers = [];
    
    //console.log("composition ready");
    
	 function freqTimerFunction(startms,  targetms, addinc, asymbol) {
			var ms;
     // //console.log("enter timer--> startms: " + startms + ", targetms: " + targetms +", addinc: " + addinc );
    //                              698                       1800                      100
    if ( !targetms ) {
        return;
    }
    if ( addinc < Math.abs(startms - targetms ) ) { 
        ms = startms + addinc;
        try {
            asymbol.stop(ms); 
        }
        catch(err) {
            //console.log("freq timer function cannot stop at " + ms);
        } 
        finally {
            sym.gen2.setValue(Math.round( ms/1.5 ));
            //500 = 1/2 second = the delay:
          //console.log("setting timer--> startms: " + startms + ", targetms: " + targetms +", addinc: " + addinc );
            setTimeout( freqTimerFunction, 500, ms, targetms, addinc, asymbol);
        }
      } else {
          //finished
          ms = targetms;

          try {
            asymbol.stop(ms); 
          }
          catch(err) {
            //console.log("freq timer function cannot stop at " + ms);
          } 
          finally {
             sym.gen2.setValue(Math.round( ms/1.5 ));
            // //console.log("in try-catch-finally");
          }
      }
    }

     function gageTimerFunction(  targetms, addinc, asymbol) {
      //check if the target is met, use absolute value for any direction up or down
      var ordinal;
      ordinal = 1;
      var startpos;
      if ( !targetms ) {
        return;
      }
      try {
        startpos = asymbol.getPosition();
      }
      catch(err) {
        startpos = targetms;
      }
      if ( addinc < Math.abs( startpos  - targetms ) ) {
      	 if (  targetms < startpos   ) {
      	 	//going in reverse
      		ordinal = -1;
      	 }

    	    asymbol.stop( startpos + ( ordinal * addinc) ); 
    	    gage_timers.push ( setTimeout( gageTimerFunction, 500, targetms, addinc, asymbol));
      }else {
     	   //finished

          ms = targetms;

          try {
              asymbol.stop(ms); 
          }
          catch(err) {
            //console.log("gage timer function cannot stop at " + ms);
          } 
  		}
    }

  var synchronize = function() {
  //speed is 0= slow, 1= medium, 2= fast, -1 = reverse med, -2 = rev fast
  var synching = false;
  var speed = 2;
  var genSynched = false;
  return {
		init : function() {
			synching = false;
			speed = 2;
		},
		startSynch : function() {
			synching = true;
			genSynched = false;
			//set start speed to nonsensical value so it will be reset by algorithm
			speed = -10;
		},

		setSynched : function(val) {
      //called by the synch arrow while it is turning, TO SAVE the "state".  when genSynched is true, the breakers can be closed.
			genSynched = val;
		},

		//state = sym.synch.getsynched();
		getSynched : function() {
      //when returns true, the generators are in synch and can be paralled on the bus.
			return genSynched;
		},
		synchStatus : function () {
			return synching;
		},
		checkStatus : function() {		if ( synching === true ) {
        //freq is the calculated difference between the current hrz values
        //speed is the current speed of the gage's arrow 
				//  the greater the freq value, the more out of synch the generators
				var freq =  Math.round(sym.hz1.getValue() - sym.hz2.getValue());

        //console.log("checkstatus ,synching: " + synching + ", speed: " + speed + ", freq: "+ freq);

				if (freq > 5 ) {
					if (speed != 2) {
						speed = 2;
       				sym.getSymbol("syncharrow").play("FAST");
       			}
   			} else if (( freq <= 5 ) && (freq > 0 )) {
   				if ( speed !== 1 ) {
   					speed = 1;
        				sym.getSymbol("syncharrow").play("MEDIUM");
   				}
    			} else if (freq === 0 ) {
    				if (speed !== 0) {
    					speed = 0;
        			}
        			sym.getSymbol("syncharrow").play("SLOW");
     			} else if (( freq < 0 ) && (freq >= -5 )) {
     				if (speed != -1 ){
     					speed = -1;
        				sym.getSymbol("syncharrow").playReverse("R_MEDIUM");
     				}
    			} else if (speed !== -2) {
    					speed = -2;
						sym.getSymbol("syncharrow").playReverse("R_FAST");
				} else if (speed === 0 ) {
						sym.getSymbol("syncharrow").play("SLOW");
				}
				//console.log("synch speed is " + speed );
			}
		},
		setspeed: function(newspeed) {
			speed = newspeed;
		},
		stopPlay : function() {
			sym.getSymbol("syncharrow").stop();
			sym.getSymbol("synchLights").$("dimmers").show();
			synching = false;
		},
		close : function() {
      //attempting to close a breaker
			if ( genSynched === true ) 
				{ return true; }
			else  { 
				sym.getSymbol("syncharrow").stop();
				sym.getSymbol("synchLights").$("dimmers").hide();
				synching = false;
				return false; 
			}
		}
	};
};
sym.synch = synchronize(); 
sym.synch.init();  

//================
powerbus = function() {
	var pvalue = "off";
	var total_amps = 200;
	var total_watts = 200;
	return {
		init:function() {
			pvalue = "off";
		},
		getValue : function() {

			return pvalue;
		},
		balance_load : function() {

			//console.log("in balance load " );
			//make sure both breakers are closed

			var b1 = sym.cbreaker1.getValue();
			var b2 = sym.cbreaker2.getValue();

			if (( b1 == "close" ) && ( b2 == "close" )) {
				var split_amps = Math.round(total_amps /2);
				var split_watts = Math.round(total_watts /2);
					sym.amps1.setValue(split_amps);
					sym.watts1.setValue(split_watts );
					sym.amps2.setValue(split_amps);
					sym.watts2.setValue(split_watts);

			} else if (( b1 == "close" ) && ( b2 == "open" )) {
        sym.amps1.setValue(total_amps);
        sym.watts1.setValue(total_watts);
        if ( sym.amps2.getValue()  !== 0 ) sym.amps2.setValue(0);
        if ( sym.watts2.getValue()  !== 0 ) sym.watts2.setValue(0); 

			} else if (( b1 == "open" ) && ( b2 == "close" )) {

        if ( sym.amps1.getValue()  !== 0 ) sym.amps1.setValue(0);
        if ( sym.watts1.getValue()  !== 0 ) sym.watts1.setValue(0); 
        sym.amps2.setValue(total_amps);
        sym.watts2.setValue(total_watts);

			} else if (( b1 == "open" ) && ( b2 == "open" )) {

        if ( sym.amps1.getValue()  !== 0 ) sym.amps1.setValue(0);
        if ( sym.watts1.getValue()  !== 0 ) sym.watts1.setValue(0);
        if ( sym.amps2.getValue()  !== 0 ) sym.amps2.setValue(0);
        if ( sym.watts2.getValue()  !== 0 ) sym.watts2.setValue(0); 
			}

			sym.getSymbol("synchLights").$("dimmers").show();

		},

		droop1 : function() {
        var b1 = sym.cbreaker1.getValue();
			  var b2 = sym.cbreaker2.getValue();
          if ( b1 == "close" ) {
              sym.amps1.setValue(54);
              sym.watts1.setValue(46);
          }		
          if ( b2 == "close" ) {
			      
         	   sym.amps2.setValue(total_amps-54);
				     sym.watts2.setValue(total_watts-46);
             sym.bus.balance_load();
          }
		},
		droop2 : function() {
      var b1 = sym.cbreaker1.getValue();
			var b2 = sym.cbreaker2.getValue();
			  //console.log("b1 and b2" + b1 + "and " + b2 );
      if  ( sym.cbreaker2.getVoltage2()  )  { 
                      
        //console.log("cbreaker2 is okay");
        if ( b2 == "close" ) { 
                 sym.amps2.setValue(58);
				         sym.watts2.setValue(50);
        } else if ( b1 == "close" ) {           
				     sym.amps1.setValue(total_amps-58);
				     sym.watts1.setValue(total_watts-50);
             sym.bus.balance_load();
        }
      }
	  }
  }
};

 sym.bus =  powerbus();
 sym.bus.init();

 sym.drawPage = function(){

	  //redraw the gages and lights:

		  sym.hz1.drawGage();
		  sym.hz2.drawGage();
			sym.bus.balance_load();
		  sym.amps1.incrementAmps1(0);
      sym.watts1.incrementWatts1(0);
      sym.amps2.incrementAmps2(0);
      sym.watts2.incrementWatts2(0); 

      sym.cbreaker1.drawVolts1();
      sym.cbreaker2.drawVolts2();

      sym.heat.drawHeat();
      sym.heat2.drawHeat();

      if ( sym.cbreaker1.getVoltage1() === true ) {
      //console.log("voltage1 is true");
        if  ( sym.cbreaker1.getValue() == "open" ) {
          sym.getSymbol("light_red_gen1_1").$("EllipseCopy").show();
          sym.getSymbol("light_green_gen1_1").$("Ellipse2").hide();
        } else	{
			  sym.getSymbol("light_red_gen1_1").$("EllipseCopy").hide();
			  sym.getSymbol("light_red_gen1_1").$("insert").hide();
			  sym.getSymbol("light_green_gen1_1").$("Ellipse2").show();
        }
      }

      if ( sym.cbreaker2.getVoltage2() === true ) {
      //console.log("voltage 2 is true");
        if  ( sym.cbreaker2.getValue() == "open" ) {
          sym.getSymbol("light_red_gen2_1").$("Ellipse").show();
          sym.getSymbol("light_green_gen2_1").$("Rectangle").show();
          sym.getSymbol("light_green_gen2_1").$("EllipseCopy").hide();

        } else	{
          sym.getSymbol("light_red_gen2_1").$("Ellipse").hide();
          sym.getSymbol("light_green_gen2_1").$("Rectangle").hide();
          sym.getSymbol("light_green_gen2_1").$("EllipseCopy").show();
        }
      }
      sym.synch.checkStatus();

};


//Call that function from another symbol (can be nested, etc) like this:
//sym.getComposition().getStage().drawPage();

//;=================

var frequency_meter1 = function() {
	var hz1_value = 0;
	var ms;
	var calibrate_val = 55;
  var calibraten = 0;
	return {
		init: function() { 
			//console.log("initing hz1");
			hz1_value = 100;
			ms =  ( hz1_value - calibrate_val ) + 540;
			sym.getSymbol("arrow_freq_gen1").stop(ms);
		},
		drawGage: function() {
			calibrate = hz1_value - 55;
      //console.log("in drawgage hz1 is: " + hz1_value);
			//ms =  ( ( calibrate * .36 ) ) * 1000 ;
			ms =  ( ( calibrate * 0.25 ) + 0.54 ) * 1000 ;
			sym.getSymbol("arrow_freq_gen1").stop(ms); 
		},

		getValue : function() {
			return hz1_value;
		},

    incrementHz1 : function(val) {
			hz1_value =  hz1_value + val;

			if ( hz1_value >= 62 ) {
				hz1_value = 60;
				sym.gen1.setValue(1200);
				if (sym.cbreaker1.getValue() == "close") {
				  sym.cbreaker1.toggle();
			 	}
			 	sym.getSymbol("arrow_freq_gen1").playReverse();
			}

			if ( hz1_value < 55 ) {
				 hz1_value = 55;
			};

     calibrate = hz1_value - 55;
			//ms =  ( ( calibrate * .36 ) ) * 1000 ;
			ms =  ( ( calibrate * .25 ) + .54 ) * 1000 ;
			sym.getSymbol("arrow_freq_gen1").stop(ms); 
		},
		setValue : function(val) {
			hz1_value = val;
      	calibrate = hz1_value - 55;
			if ( hz1_value >= 62 ) {
        //trip circuit breaker and set back to 60
				hz1_value = 60;
				sym.gen1.setValue(1200);
				if (sym.cbreaker1.getValue() == "close") {
				  sym.cbreaker1.toggle();
			 	}
			 	sym.getSymbol("arrow_freq_gen1").playReverse();
			}

			if ( hz1_value < 55 ) {
				 hz1_value = 55;
			}
      	calibrate = hz1_value - 55;
			ms =  ( ( calibrate * 0.25 ) + 0.54 ) * 1000 ;
			sym.getSymbol("arrow_freq_gen1").stop(ms); 
		}
	};
};

sym.hz1 = frequency_meter1();    

var frequency_meter2 = function() {
	//calibration:  milleseconds (ms) range from 0 to 360 (needle straight down)

	var hz2_value = 0;
	var ms;
	var max_hz;
	var calibrate_val = 55;
  var calibrate = 0;
	return {
		init: function() {
			//startup at 55 hz
			 hz2_value = 55;
			//ms =  ( hz2_value - calibrate_val ) + 540;
			sym.getSymbol("arrow_freq_gen2").stop(1800);
	   

		},
		drawGage: function() {
			calibrate = hz2_value - 55;
      //console.log("in drawgage hz2 is: " + hz2_value);
			//ms =  ( ( calibrate * .36 ) ) * 1000 ;
			ms =  ( ( calibrate * 0.25 ) + 0.54 ) * 1000 ;
			sym.getSymbol("arrow_freq_gen2").stop(ms); 
		},

		getValue : function() {
			return hz2_value;
		},

    incrementHz2 : function(val) {

      if ( speedControl == "rated" ) {
		    hz2_value =  hz2_value + val;
		   if ( hz2_value >= 62 ) {
			    hz2_value = 60;
		       sym.gen2.setValue(1200);
			    if (sym.cbreaker2.getValue() == "close") {
				    sym.cbreaker2.toggle();
			    }
			    sym.getSymbol("arrow_freq_gen2").playReverse();
		    }
      } else {
        // hz2 is not rated so it can't make any real gains
        hz2_value = hz2_value + 0.005;
      }
	   if ( hz2_value < 55 ) {
				 hz2_value = 55;
	   } 
     calibrate = hz2_value - 55;
	   ms =  ( ( calibrate * 0.25 ) + 0.54 ) * 1000 ;
	   sym.getSymbol("arrow_freq_gen2").stop(ms);

	 },
	 setValue : function(val) {
	   hz2_value = val;
     if ( speedControl == "rated" ) {
		   if ( hz2_value >= 62 ) {
          //trip circuit breaker and fall back to 60
			    hz2_value = 60;
		      sym.gen2.setValue(1200);
			    if (sym.cbreaker2.getValue() == "close") {
				    sym.cbreaker2.toggle();
			    }
			    sym.getSymbol("arrow_freq_gen2").playReverse();
		    } 
      } else {
        //speedControl is idle
        hz2_value = hz2_value + 0.010;
      }
	   if ( hz2_value < 55 ) {
				 hz2_value = 55;
	   }  
     calibrate = hz2_value - 55;
	   //ms =  ( ( calibrate * .36 ) ) * 1000 ;
	   ms =  ( ( calibrate * 0.25 ) + 0.54 ) * 1000 ;
	   sym.getSymbol("arrow_freq_gen2").stop(ms); 
	  },

	  setRated : function() {
		  speedControl = "rated";
 			hz2_value = 60;
 			if ( 	sym.cbreaker2.getVoltage2() === false){
 			   sym.getSymbol("arrow_freq_gen2").play("play55");
 			  // console.log("voltage 2 was false. Played volt2 to 100");
 			} else {
 				if (  sym.synch.synchStatus() === true  ) {
        			//actively synching so make it drop off:
        			//console.log("synchstatus is true");
        			sym.synch.stopPlay();
        			//console.log("stopped play");
        			if (sym.cbreaker1.getValue() == "close") {
               	 //console.log("open cb1");
                	sym.cbreaker1.toggle();
            	}
            	if (sym.cbreaker2.getValue() == "close") {
                	//console.log("open cb2");
               	 sym.cbreaker2.toggle();
            	}
            }
          }
        		//the freq timer in the next section does not work on ie9
	    		//var freqsym = sym.getSymbol(	"arrow_freq_gen2"); 
	    	//	var startms =  freqsym.getPosition(); 
	    	//	if ( !startms ) {
	    		 	sym.gen2.setValue(1200);
	    	//	} else {
	    	//		freqTimerFunction(startms,  1800, 100, freqsym);
         //   }
	    		sym.getSymbol("RPMgages").$("rpm2").html('1200');

		}
	};
};

sym.hz2 = frequency_meter2();    

//================
var ammeter1 = function() {
	var vamps1 = 0;
	var targetms;
	var timer_id = 0;
	return {

    init : function() {
      //move the needle to the zero position:
			sym.getSymbol("arrow_amm_gen1").stop(540);
    },
		setValue: function(val) { 
		   if ( vamps1 == val) { return };
			vamps1 = val;
        	var targetms =  (( vamps1 * 0.00251 ) + 0.54) *1000; 
			var gagesym = sym.getSymbol(	"arrow_amm_gen1");
		  // gageTimerFunction( targetms, 100, gagesym)  ;
       gagesym.stop(targetms);
		},

		getValue : function() {
			return vamps1;
		},
		incrementAmps1 : function(val) {
			vamps1 = vamps1 + val;
			if (vamps1 < 0 ) {
				vamps1 = 0;
				return;
			}
			//calculate where to put the arrow
			p =  (( vamps1 * 0.00251 ) + 0.54) *1000;


			sym.getSymbol("arrow_amm_gen1").stop(p);


		}
	};
};

sym.amps1 = ammeter1();  

//====================

var ammeter2 = function() {
	var vamps2 = 0;
	var timer_id;
	var p;
	return {
    init: function() { 
			sym.getSymbol("arrow_amm_gen2").stop(540);
    },
		setValue: function(val) { 
			  if ( vamps2 == val) { return }; 
			vamps2 = val; 
         var targetms =(( vamps2 * 0.00251 ) + 0.54) *1000;  
			var gagesym = sym.getSymbol(	"arrow_amm_gen2");
	//		gageTimerFunction( targetms, 100, gagesym)  ;
       gagesym.stop(targetms);

		},

		getValue : function() {
			return vamps2;
		},
		incrementAmps2 : function(val) {
			vamps2 = vamps2 + val;
			if (vamps2 < 0 ) {
				vamps2 = 0;
				return;
			} 
			p =  (( vamps2 * 0.00251 ) + 0.54) * 1000; 
			sym.getSymbol("arrow_amm_gen2").stop(p);
		}
	};
};

sym.amps2 = ammeter2();  

//=====================

var wattmeter1 = function() {
	var vwatts1 = 0;
	var p;
	return {
    init: function() {
      //move the needle to the zero position:
      sym.getSymbol("arrow_watt_gen1").stop(540);
    },
		setValue: function(val) {
			  if ( vwatts1 == val) { return };
			//startup at 40 hz
			vwatts1 =val;
         var targetms =  ( ( vwatts1 * 0.00404 ) + 0.55) * 1000; 
			var gagesym = sym.getSymbol(	"arrow_watt_gen1");
	//		gageTimerFunction( targetms, 100, gagesym)  ;
       gagesym.stop(targetms);
		},

		getValue : function() {
			return vwatts1;
		},
		incrementWatts1 : function(val) {
			vwatts1 = vwatts1 + val;
			if (vwatts1 < 0 ) {
				vwatts1 = 0;
				return;
			} 
			p = ( ( vwatts1 * 0.00404 ) + 0.55) * 1000; 
			sym.getSymbol("arrow_watt_gen1").stop(p);

		}
	};
};

sym.watts1 = wattmeter1();  

//=====================

var wattmeter2 = function() {
	var vwatts2 = 0;
	var p;
	return {
    init : function() { 
      sym.getSymbol("arrow_watt_gen2").stop(550);
    },
		setValue : function(val) { 
			  if ( vwatts2 == val) { return };
			vwatts2 = val;
         var targetms =  ( ( vwatts2 * 0.00404 ) + 0.55) * 1000; 
			var gagesym = sym.getSymbol(	"arrow_watt_gen2");
	//		gageTimerFunction( targetms, 100, gagesym)  ;
       gagesym.stop(targetms);

		},

		getValue : function() {
			return vwatts2;
		},
		incrementWatts2 : function(val) {
			vwatts2 = vwatts2 + val;
			if (vwatts2 < 0 ) {
				vwatts2 = 0;
				return;
			} 
			p =  ( ( vwatts2 * 0.00404 ) + 0.55) * 1000; 
			sym.getSymbol("arrow_watt_gen2").stop(p);

		}
	};
};

sym.watts2 = wattmeter2();  

//=====================

circuitBreaker1 = function() {
	var b1value = "open";
	var synched1 = false;
	var voltage1 = false;
	return {
		init:function() {
			b1value = "open";
			synched1 = false;
			voltage1 = false;
		},
		getValue:function() {

			return b1value;
		},

    drawVolts1: function() {
      if (voltage1 === true ) {
        sym.getSymbol("arrow_volt_gen1").stop("play500");

      }
    },
		setSynched1 : function(val) {
			 //console.log("cb1 synched1 is " + val);
			synched1 =  val;
		},
		startVoltage1 : function() {
			voltage1 = true;
		},
		getVoltage1 : function() {
			return voltage1;
		},
		startCB1:function() {
			//used when the generator is started.
			//can also b used to "trip" the breaker	
			sym.getSymbol("light_red_gen1_1").$("EllipseCopy").show();
			sym.getSymbol("light_green_gen1_1").$("Ellipse2").hide();
			if (b1value == "close" ) {
				////console.log("tripping cb 1");
				b1value = "open";
				sym.bus.balance_load();
				sym.getSymbol("circuitBreaker1").play("TRIP");
				sym.hz1.init(); 
			}	
			b1value = "open";
		},
		closeCB1:function() {
			b1value = "close";
			sym.getSymbol("light_red_gen1_1").$("EllipseCopy").hide();
			sym.getSymbol("light_red_gen1_1").$("insert").hide();
			sym.getSymbol("light_green_gen1_1").$("Ellipse2").show();

		},

		toggle:function() {
			 //console.log("cb1's synchnob is " + synched1 );
			if  ( voltage1 === false )  {
				return;
			}
			//stop timers if they are running in the gage_timers array

		//	for (var i = 0; i < gage_timers.length; i++) {
    	//		clearTimeout(gage_timers[i]);
		//	}
			gage_timers = [];

			if ( b1value == "open" ) {
				 //console.log("attempting to close breaker1");
				if (synched1 === false ) {
					return ;
				} 
				if ( sym.cbreaker2.getValue() == "open" )  {

						b1value = "close";
						sym.getSymbol("circuitBreaker1").play();
						sym.bus.balance_load();
						sym.getSymbol("light_red_gen1_1").$("EllipseCopy").hide();
						sym.getSymbol("light_green_gen1_1").$("Ellipse2").show();
				}

				else if ( sym.synch.close() === true) {
					////console.log("successfully synched gen 1 to gen 2");
					b1value = "close";
					sym.synch.stopPlay();
					sym.getSymbol("circuitBreaker1").play();
					sym.bus.balance_load();
					sym.getSymbol("light_red_gen1_1").$("EllipseCopy").hide();
					sym.getSymbol("light_green_gen1_1").$("Ellipse2").show();

				} else  {
						//blackout 

						sym.$("FAIL_PANEL").show();
				} 			
     			} else {
					//console.log(" cb1 is closed and trying to open it");
					b1value = "open";
					sym.getSymbol("light_red_gen1_1").$("EllipseCopy").show();
					sym.getSymbol("light_green_gen1_1").$("Ellipse2").hide();
					sym.getSymbol("circuitBreaker1").play("TRIP");

					sym.bus.balance_load();

			}
			return b1value;
		}
	};
};

 sym.cbreaker1 = circuitBreaker1();
 sym.cbreaker1.init();
 //================

circuitBreaker2 = function() {
 	var b2value = "close";
	var synched2 = false;
	var voltage2 = false;
	return {
		init:function() {
			b2value = "open";
			voltage2 = false;
		},
		getValue:function() {
			return b2value;
		},
    drawVolts2: function() {
      if (voltage2 ) {
        sym.getSymbol("arrow_volt_gen2").stop("play500");
      }
    },
 		setSynched2 : function(val) { 
			synched2 =  val;
		},
		startVoltage2 : function() {
	//	console.log("voltage2 is started");
			voltage2 = true;
		},
		getVoltage2 : function() {
		 //  console.log("voltage 2 is " + voltage2);
			return voltage2;
		},
		startCB2:function() { 
			sym.getSymbol("light_red_gen2_1").$("Ellipse").show();
			sym.getSymbol("light_green_gen2_1").$("Rectangle").show();
			sym.getSymbol("light_green_gen2_1").$("EllipseCopy").hide();

			if ( b2value == "close") { 
				b2value = "open";
				sym.bus.balance_load();
				sym.getSymbol("circuitBreaker1").play("TRIP");
				sym.hz2.init(); 
			}
			b2value = "open";
		},
		closeCB2:function() {
			b2value = "close";
			sym.getSymbol("light_red_gen2_1").$("Ellipse").hide();
			sym.getSymbol("light_green_gen2_1").$("Rectangle").hide();
			sym.getSymbol("light_green_gen2_1").$("EllipseCopy").show();
		},
		toggle:function() {
			 //console.log("cb2's synchnob is " + synched2 );
			if  ( voltage2 === false )  {
				return false;
			}; 
		//	for (var i = 0; i < gage_timers.length; i++) {
    //			clearTimeout(gage_timers[i]);
		//	}
			gage_timers = [];

			if ( b2value === "open" ) {
				 //console.log("attempting to close breaker2");
				if (synched2 == false ) {
					return;
				} 
						if (sym.cbreaker1.getValue() === "open" )  {

					b2value = "close";
					sym.getSymbol("br_contr_gen2").play();
					sym.bus.balance_load();
					sym.getSymbol("light_red_gen2_1").$("Ellipse").hide();
					sym.getSymbol("light_green_gen2_1").$("Rectangle").hide();
					sym.getSymbol("light_green_gen2_1").$("EllipseCopy").show();
					//console.log("adjusted lights on cbreaker2");

				} else if ( sym.synch.close() === true) {

					////console.log("successfully synched gen 2 to gen1");
					b2value = "close" ;
					sym.synch.stopPlay();
					sym.getSymbol("br_contr_gen2").play();
					sym.bus.balance_load();

					sym.getSymbol("light_red_gen2_1").$("Ellipse").hide();
					sym.getSymbol("light_green_gen2_1").$("Rectangle").hide();
					sym.getSymbol("light_green_gen2_1").$("EllipseCopy").show();

				} else  {
						//blackout 

						sym.$("FAIL_PANEL").show();
				} 


			} else if   ( sym.synch.synchStatus() === false ) {
					b2value = "open";
					//console.log("breaker 2 is being opened and 1 is also open");

					sym.getSymbol("light_red_gen2_1").$("Ellipse").show();
					sym.getSymbol("light_green_gen2_1").$("Rectangle").show();
					sym.getSymbol("light_green_gen2_1").$("EllipseCopy").hide();

					sym.bus.balance_load();

					sym.getSymbol("br_contr_gen2").play("TRIP");

			}

			return b2value;
		}
	};
};
     
 sym.cbreaker2 = circuitBreaker2();
 sym.cbreaker2.init();

//================
heater = function() {

	var hvalue = "off";
	return {
		init:function() {
			hvalue = "on";
		},
		getValue : function() {

			return hvalue;
		},

		drawHeat : function() {
			if ( hvalue == "off" ) {
         	sym.getSymbol("heaterLight1").$("Ellipse").show();
         	sym.getSymbol("heat_switch_gen1").stop("ON");
			} else {
         	sym.getSymbol("heaterLight1").$("Ellipse").hide();
         	sym.getSymbol("heat_switch_gen1").stop("OFF");
			}
    },
		toggle : function() {
			if ( hvalue == "off" ) {
				hvalue = "on" ;
         	sym.getSymbol("heaterLight1").$("Ellipse").hide();
         	sym.getSymbol("heat_switch_gen1").stop("OFF");
			} else {
				hvalue = "off";
         	sym.getSymbol("heaterLight1").$("Ellipse").show();
         	sym.getSymbol("heat_switch_gen1").stop("ON");
			}
			return hvalue;
		}
	};
};

 sym.heat =  heater();
 sym.heat.init();

  heater2 = function() {

	var hvalue;
	return {
		init:function() {
			hvalue = "on";
		},
		getValue : function() {
			return hvalue;
		},
    drawHeat : function() {
			if ( hvalue == "off" ) {
         	sym.getSymbol("heaterLight1").$("Ellipse").show();
         	sym.getSymbol("heat_switch_gen1").stop("ON");
			} else {
         	sym.getSymbol("heaterLight1").$("Ellipse").hide();
         	sym.getSymbol("heat_switch_gen1").stop("OFF");
			}
    },
		toggle : function() {
			if ( hvalue == "off" ) {
				hvalue = "on" ;
         	sym.getSymbol("heatLight_gen2_1").$("Ellipse").hide();
         	sym.getSymbol("heat_sw_gen2").stop("OFF");
			} else {
				hvalue = "off";
         	sym.getSymbol("heatLight_gen2_1").$("Ellipse").show();
         	sym.getSymbol("heat_sw_gen2").stop("ON");
			}
			return hvalue;
		}
	};
};
 sym.heat2 =  heater2();
 sym.heat2.init();

startGen1 = function() {
	var g1value;
	var rpms1;
	return {
		init:function() {
			g1value = "off";
			rpms1 = 0;
		},
		startup : function() {

			g1value = "on";
			sym.amps1.init();
      	sym.watts1.init();
			sym.getSymbol("gen1light").$("dimmerCopy2").hide();
      ////////////////
         sym.getSymbol("engineRoom").getSymbol("engine1").getSymbol("slide_panel").play();
         sym.getSymbol("engineRoom").getSymbol("engine1").getSymbol("slide_panel").getSymbol("gages1").play();
         sym.getSymbol("arrow_volt_gen1").play("play100");

      //////////////////
      
			//console.log("started gen 1: " + g1value );
			sym.cbreaker1.startCB1();
			sym.hz1.init();
			sym.hz1.setValue(60);
			return g1value;
		},

		getValue : function() {
			return g1value;
		},
		getRPMs1 : function() {
			return rpms1;
		},
		setValue : function(val) {
		  //the frequency and rpms have a direct relationship
		  // when the rpms change, the frequency (hz) follows.
		  ////console.log("in generator 1, val is: " + val );
			rpms1 = val ; 
			sym.hz1.setValue( 60 + ( val - 1200) );
      //console.log("!!!! in generator 1, set hz val is: " + 60 + ( val - 1200));
			sym.getSymbol("RPMgages").$("rpm1").html(val);
      sym.$("rpmText1").html(val);
		},
		setGages : function() {
			if ( rpms1 > 1300 ) { rpms1 = 1300 };
			sym.getSymbol("engineRoom").getSymbol("engine1").getSymbol("slide_panel").$("rpmText").html(rpms1);
			sym.getSymbol("RPMgages").$("rpm1").html(rpms1);


		},
		setRPMs1 : function(val) { 
			rpms1 =  val;
			sym.getComposition().getStage().getSymbol("engineRoom").getSymbol("engine1").getSymbol("slide_panel").$("rpmText").html(rpms1);
		//	sym.getSymbol("RPMgages").$("rpm1").html(rpms1);
		//	sym.synch.checkStatus();
			sym.getComposition().getStage().getSymbol("RPMgages").$("rpm1").html(rpms1);
			sym.synch.checkStatus();
		},
		incRPMs1 : function(val) { 
			rpms1 = rpms1 + val;
			sym.getComposition().getStage().getSymbol("engineRoom").getSymbol("engine1").getSymbol("slide_panel").$("rpmText").html(rpms1);
		//	sym.getSymbol("RPMgages").$("rpm1").html(rpms1);
		//	sym.synch.checkStatus();
			sym.getComposition().getStage().getSymbol("RPMgages").$("rpm1").html(rpms1);
			sym.synch.checkStatus();
		}

	};
};

sym.gen1 = startGen1();
sym.gen1.init();



startGen2 = function() {
	var g2value;
	var rpms2;
	return {
		init:function() {
			g2value = "off";
			rpms2 = 0;
		},
		startup : function() {
			
			g2value = "on";
			
      	sym.watts2.init();
      	sym.amps2.init();
			sym.getSymbol("gen2light").$("dimmerCopy3").hide();
			//////////////////
         //the following functions will update the engine speed (rpms2)
         
			sym.getSymbol("engineRoom").getSymbol("engine2").getSymbol("slide_panel_2").play();
			sym.getSymbol("engineRoom").getSymbol("engine2").getSymbol("slide_panel_2").getSymbol("gages2").play();

			//////////// note:  hz2 is initiated in the cbreaker2.startCB2 if breaker is closed

			sym.cbreaker2.startCB2();
			sym.hz2.init();
			sym.hz2.setValue(57);
			
			return g2value;
		},

		getValue : function() {
			return g2value;
		},

		getRPMs2 : function() {

			return rpms2;
		},
		setValue : function(val) {
			rpms2 = val;
      //console.log("!!!!!! hz2 value is " + rpms2);
			sym.hz2.setValue( 60 + ( val - 1200) );
			sym.getSymbol("RPMgages").$("rpm2").html(val);
			sym.getSymbol("engineRoom").getSymbol("engine2").getSymbol("slide_panel_2").$("rpmText2").html(val);


		},
		setGages : function() {
			if (rpms2 > 1300 ) { rpms2 = 1300 };
			sym.getSymbol("engineRoom").getSymbol("engine2").getSymbol("slide_panel_2").$("rpmText2").html(rpms2);
			sym.getSymbol("RPMgages").$("rpm2").html(rpms2);
		},
		setRPMs2 : function(val) { 
			rpms2 =  val;
			sym.getComposition().getStage().getSymbol("engineRoom").getSymbol("engine2").getSymbol("slide_panel_2").$("rpmText2").html(rpms2);
			sym.getComposition().getStage().getSymbol("RPMgages").$("rpm2").html(rpms2);
			sym.synch.checkStatus();
		},
		incRPMs2 : function(val) { 
      //console.log("rpms2 is" + rpms2);
			rpms2 = rpms2 + val;
      //console.log("rpms2 is" + rpms2);
			sym.getComposition().getStage().getSymbol("engineRoom").getSymbol("engine2").getSymbol("slide_panel_2").$("rpmText2").html(rpms2);
			sym.getComposition().getStage().getSymbol("RPMgages").$("rpm2").html(rpms2);
			sym.synch.checkStatus();
		}

	};
};

sym.gen2 = startGen2();
sym.gen2.init();

synchswitch1 = function() {
         //turns on synching for generator 1
	var s1value = "off";
	return {
		init:function() {
			s1value = "off";
		},
		getValue : function() {
			return s1value;
		},
		toggle : function() {
			if ( sym.cbreaker1.getVoltage1() == false) {
				return false;
			} else if ( s1value == "off" )   {
				//check if engine is on, the other synch switch is off
				var cb2 = sym.cbreaker2.getValue();

				var  testeng1 = sym.gen1.getValue();
				if  ( testeng1 == "on"  ){ 
						sym.getSymbol("sync_switch_gen1").play("ON");
						s1value = "on";
						sym.cbreaker1.setSynched1(true);
						if ( cb2 == "close" ) {

              			//start the arrow and lights
							sym.synch.startSynch();
							sym.synch.checkStatus();
						}
				}
			} else  {
				s1value = "off";

				sym.getSymbol("sync_switch_gen1").playReverse();
				sym.cbreaker1.setSynched1(false);
				if (sym.synch.synchStatus() == true ) {
					sym.synch.stopPlay();	
				} 
			}
			return s1value;
		}
	};
};
 sym.s_switch1 =  synchswitch1();
 sym.s_switch1.init();

synchswitch2 = function() {
         //turns on synching for generator 2
	var s2value = "off";
	return {
		init:function() {
			s2value = "off";
		},
		getValue : function() {
			return s2value;
		},
		toggle : function() {
			if ( sym.cbreaker2.getVoltage2() == false) {
				return false;
			} else 	if   ( s2value == "off" )  {
				//check if engine is on, the other synch switch is off
				//if other breaker is closed...SYNCHRONIZE
				var cb1 = sym.cbreaker1.getValue();
				//console.log("checking cb1 value: " + cb1);
				var  testeng2 = sym.gen2.getValue();
				if  ( testeng2 == "on"  ){ 
						sym.getSymbol("sync_switch_gen2").play("ON");
						s2value = "on";
						sym.cbreaker2.setSynched2(true);
						if ( cb1 == "close" ) {

							sym.synch.startSynch();
							sym.synch.checkStatus();
						}
				}
			} else  {
				s2value = "off";
				//console.log("turned off synch swt 2");
				sym.getSymbol("sync_switch_gen2").playReverse();
				sym.cbreaker2.setSynched2(false);
				if ( sym.synch.synchStatus() == true ) {

			sym.synch.stopPlay();	
				} 
			}
			return s2value;
		}
	};
};
 sym.s_switch2 =  synchswitch2();
 sym.s_switch2.init();




      });
      //Edge binding end 
	  //end composition ready !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  
	   
      
       

     Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1395, function(sym, e) {
         // insert code here`
         sym.getComposition().getStage().drawPage();
         sym.stop();
         
         

      });
      //Edge binding end
     

      
 
		
   
      

 

      Symbol.bindSymbolAction(compId, symbolName, "creationComplete", function(sym, e) {
         // insert code to be run when the symbol is created here
    

      });
      //Edge binding end
 

      

      

         

     

      
      
 

      Symbol.bindElementAction(compId, symbolName, "${sync_switch_gen1}", "click", function(sym, e) {
         // insert code for mouse click here
         
         
         // Set a toggle to hide or show an element 
         var ss1;
         ss1 = sym.s_switch1.toggle();
         

      });
      //Edge binding end

   
      

      
 

       

      Symbol.bindElementAction(compId, symbolName, "${man_volt_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
       

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${heat_sw_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
         sym.heat2.toggle();
         
         

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${sync_switch_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
         
         //console.log("toggle switch 2");
         var ss2;
         ss2 = sym.s_switch2.toggle();
         
         

      });
      //Edge binding end 
 
 
 
      Symbol.bindElementAction(compId, symbolName, "${rheo_speed_gen1}", "mouseover", function(sym, e) {
         // insert code to be run when the mouse hovers over the object
         // if the circuit breaker is closed, make sure the buttons will appear
         var  testeng = sym.gen1.getValue();
         if ( testeng == "on" ) {
         	// Show an element 
            ////console.log("gen 1 is " + testeng);
         
         
         	if ( sym.cbreaker1.getValue() == "close") { 
         		// Show an element 
         		sym.$("acellerate1").show();
         
         		// Show an element 
         		sym.$("decellerate1").show();
         	}
         }

      });
      //Edge binding end

 
   //=========================================================



      Symbol.bindElementAction(compId, symbolName, "${acellerate1}", "click", function(sym, e) {
        // insert code for mouse click here
      //console.log('clicked acell 1');
        //return if needle is off the dial (should never happen):
        if (sym.hz1.getValue() >= 65 ) return;
          //console.log("hz1 not over 65");
          sym.hz1.incrementHz1(.2);
        //  console.log("hz1 adjusted");
          
          sym.gen1.incRPMs1(1);
        
          sym.getSymbol("rheo_speed_gen1").play();
         // console.log("played rheo");
         if (sym.gen2.getRPMs2() >= 1187 ) {
         	//only continue when the rpms are over 1187
        //  console.log("gen 2 rpms over 1187")
        		if (sym.cbreaker1.getValue() == "open" ) return;
          	sym.amps1.incrementAmps1( 15);
          	sym.watts1.incrementWatts1( 15);
       		if (sym.cbreaker2.getValue() == "open" ) return;
          //  console.log("adjusting side2");
          	sym.hz2.incrementHz2(-.1);
          	sym.amps2.incrementAmps2(-8);
          	sym.watts2.incrementWatts2(-8);
			}
      });
      //Edge binding end

      

	  Symbol.bindElementAction(compId, symbolName, "${decellerate1}", "click", function(sym, e) {
         // insert code for mouse click here
     
         if (sym.hz1.getValue() <= 55) return;
		    sym.gen1.incRPMs1(-1);
        sym.hz1.incrementHz1(-.2);
        sym.getSymbol("rheo_speed_gen1").playReverse();
         
         if (sym.gen1.getRPMs1() <= 1187 ) return;
         //do not continue or it will send the amps and watts into negative values
  
        		if (sym.cbreaker1.getValue() == "open" ) return;
        		sym.amps1.incrementAmps1(-15);
        		sym.watts1.incrementWatts1(-15);
        		if (sym.cbreaker2.getValue() == "open" ) return;
         	sym.hz2.incrementHz2(+.1);
        		sym.amps2.incrementAmps2( 8);
        		sym.watts2.incrementWatts2( 8);
		
      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${acellerate2}", "click", function(sym, e) {
         // insert code for mouse click here
         //return if needle is off the dial(should never happen):
		 if (sym.hz2.getValue() >= 65 ) return;
        sym.hz2.incrementHz2(.2);
        sym.gen2.incRPMs2(1);
        sym.getSymbol("rheo_speed_gen2").play();
        
          if (sym.gen2.getRPMs2() >= 1187 ) {
         //only continue when the rpms are over 1187
  
         	if (sym.cbreaker2.getValue() == "open" ) return;
        		sym.amps2.incrementAmps2( 15);
        		sym.watts2.incrementWatts2( 15);
        		if (sym.cbreaker1.getValue() == "open" ) return;
         	sym.hz1.incrementHz1(-.1);
          	sym.amps1.incrementAmps1(-8);
          	sym.watts1.incrementWatts1(-8);
			}
      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${decellerate2}", "click", function(sym, e) {
         // insert code for mouse click here
        if (sym.hz2.getValue() <= 0) return;
        sym.hz2.incrementHz2(-.2);
        sym.gen2.incRPMs2(-1);
        sym.getSymbol("rheo_speed_gen2").playReverse();
         if (sym.gen2.getRPMs2() <= 1187 ) return;
         //do not continue or it will send the amps and watts into negative values
         if (sym.cbreaker2.getValue() == "open" ) return;
        sym.amps2.incrementAmps2(-15);
        sym.watts2.incrementWatts2(-15);
         if (sym.cbreaker1.getValue() == "open" ) return;
         sym.hz1.incrementHz1(+.1);
        sym.amps1.incrementAmps1( 8);
        sym.watts1.incrementWatts1( 8);

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${rheo_speed_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
         
      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${rheo_speed_gen2}", "mouseover", function(sym, e) {
         // insert code to be run when the mouse hovers over the object
          // if the circuit breaker2 is closed, make sure the buttons will appear
         var  testeng = sym.gen2.getValue();
      
         if ( testeng == "on" ) {
         	 
         	if ( sym.cbreaker2.getValue() == "close") { 
         	// Show an element 
         
         		// Show an element 
         		sym.$("acellerate2").show();
         
         		// Show an element 
         		sym.$("decellerate2").show();
         	}
         }

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${groundTestbtn}", "click", function(sym, e) {
         // insert code for mouse click here
         // Set a toggle to hide or show an element 
         if (sym.getSymbol("groundLights").$("cenerlight").is(":visible")) {
         	sym.getSymbol("groundLights").$("cenerlight").hide();
         } else {
         	sym.getSymbol("groundLights").$("cenerlight").show();
         }

      });
      //Edge binding end

     

      Symbol.bindElementAction(compId, symbolName, "${groundTestbtn}", "mouseout", function(sym, e) {
         // insert code to be run when the mouse is moved off the object
         // Hide an element 
         sym.getSymbol("groundTestbtn").$("Rectangle").hide();

      });
      //Edge binding end
 
      

      

      

      

      Symbol.bindElementAction(compId, symbolName, "${droop_gen1}", "click", function(sym, e) {
         // insert code for mouse click here
         
         
         
         var  testeng = sym.gen1.getValue();
         if ( testeng == "on" ) {
         	sym.getSymbol("droop_gen1").stop("droop");
         	sym.bus.droop1();
         	
         
         }else {
         	//sym.getSymbol("droop_gen1").stop("droop");
         }
         
         
         

      });
      //Edge binding end

      

      

      

      

      

      Symbol.bindElementAction(compId, symbolName, "${speed_control2}", "click", function(sym, e) {
         // insert code for mouse click here

             sym.getSymbol("speed_control2").play("rated");
             var  tempheat;
             tempheat = sym.hz2.setRated();


      });
      //Edge binding ends

      

      Symbol.bindElementAction(compId, symbolName, "${man_vol_contr_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
                //  var  testeng = sym.gen2.getValue();
                  //console.log("turning on voltage for engine 2 if: " + testeng);
                //  if ( testeng == "on" ) {
                     sym.getSymbol("arrow_volt_gen2").play("play400");
         			   sym.cbreaker2.startVoltage2();
         			   ////console.log("switching lights");
                  	sym.getSymbol("light_red_gen2_1").$("Ellipse").show();
                  	sym.getSymbol("light_green_gen2_1").$("Rectangle").show();
                  	sym.getSymbol("light_green_gen2_1").$("EllipseCopy").hide();
         
         				sym.$("acellerate2").show();
         				sym.$("decellerate2").show();
         				sym.getSymbol("man_vol_contr_gen2").play();
               //   }
         

      });
      //Edge binding end

      

      Symbol.bindElementAction(compId, symbolName, "${heat_switch_gen1}", "click", function(sym, e) {
         // insert code for mouse click here
         sym.heat.toggle();

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${circuitBreaker1}", "click", function(sym, e) {
         // insert code for mouse click here
         //turn on red light:
         var  testeng = sym.gen1.getValue();
         if ( testeng == "on" ) {
         	 sym.cbreaker1.toggle();
         
         }

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${br_contr_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
         var  testeng = sym.gen2.getValue();
         if ( testeng == "on" ) {
         	////console.log("test eng on,  going to toggle");
         	sym.cbreaker2.toggle();
         
         }

      });
      //Edge binding end

      

    


      Symbol.bindElementAction(compId, symbolName, "${man_vol_contr_gen1}", "click", function(sym, e) {
         // insert code for mouse click here
         
                 //var  testeng = sym.gen1.getValue();
                  //console.log("turning on voltage for engine 1 :" + testeng);
                 // if ( testeng == "on" ) {
                  	sym.getSymbol("light_red_gen1_1").$("EllipseCopy").show();
                  	sym.getSymbol("light_red_gen1_1").$("insert").show();
                  	sym.getSymbol("light_green_gen1_1").$("Ellipse2").hide(); 
         			   sym.cbreaker1.startVoltage1();
         
         			   sym.getSymbol("man_vol_contr_gen1").play();
         
                     sym.getSymbol("arrow_volt_gen1").play("play400");
                     sym.$("acellerate1").show();
         				sym.$("decellerate1").show();
                //  }

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${viewEngPanbtn}", "click", function(sym, e) {
         
         sym.play("LBL_ENGINEROOM");
         

      });
      //Edge binding end

      

      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

      

      

      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 829, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

      

      Symbol.bindElementAction(compId, symbolName, "${startengine1}", "click", function(sym, e) {
         // insert code for mouse click here
         
         var  testeng = sym.getComposition().getStage().gen1.getValue();
         //console.log("testeng is1: " + testeng );
         if ( testeng == "off" ) {

         	sym.getSymbol("startengine1").play();

          sym.getComposition().getStage().gen1.startup(); 

            // Play an audio track 
            //sym.getComposition().getStage().$("generator_sound")[0].play();
         
         }
         
         
         

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${startengine2}", "click", function(sym, e) {
         var  testeng = sym.getComposition().getStage().gen2.getValue();
         //console.log("testeng2 is: " + testeng );
         if ( testeng == "off" ) {
            //starts off in idle rating
         
         
           sym.getSymbol("startengine2").play();
         
         
           sym.getComposition().getStage().gen2.startup();
         
         
           // Play a short audio track 
          //sym.getComposition().getStage().$("generator_sound")[0].play();
          }

      });
      //Edge binding end



    

      

      Symbol.bindElementAction(compId, symbolName, "${FAIL_PANEL}", "click", function(sym, e) {
         // insert code for mouse click here
         
         sym.play();
         

      });
      //Edge binding end

      

      Symbol.bindElementAction(compId, symbolName, "${switchbtn}", "click", function(sym, e) {
         // insert code for mouse click here
         
         sym.play("LBL_SWITCHBOARD");

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${arrow_freq_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
         
      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${drrop_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
         // insert code for mouse click here
         
         sym.bus.droop2();
         
         sym.getSymbol("drrop_gen2").play("droop");
         
         
         
         
         

      });
      //Edge binding end

   })("stage");
   //Edge symbol end:'stage'

   //=========================================================
   
   //Edge symbol: 'circ_br_switch'
   (function(symbolName) {   
   
   })("circ_br_switch");
   //Edge symbol end:'circ_br_switch'

   //=========================================================
   
   //Edge symbol: 'arrow'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("arrow");
   //Edge symbol end:'arrow'

   //=========================================================
   
   //Edge symbol: 'gage_cover'
   (function(symbolName) {   
   
   })("gage_cover");
   //Edge symbol end:'gage_cover'

   //=========================================================
   
   //Edge symbol: 'lamp_white_sm'
   (function(symbolName) {   
   
   })("lamp_white_sm");
   //Edge symbol end:'lamp_white_sm'

   //=========================================================
   
   //Edge symbol: 'lamp_white_lg'
   (function(symbolName) {   
   
   })("lamp_white_lg");
   //Edge symbol end:'lamp_white_lg'

   //=========================================================
   
   //Edge symbol: 'trig_black_man_contr'
   (function(symbolName) {   
   
   })("trig_black_man_contr");
   //Edge symbol end:'trig_black_man_contr'

   //=========================================================
   
   //Edge symbol: 'lockout_gen1'
   (function(symbolName) {   
   
   })("lockout_gen1");
   //Edge symbol end:'lockout_gen1'

   //=========================================================
   
   //Edge symbol: 'lockout_gen2'
   (function(symbolName) {   
   
   })("lockout_gen2");
   //Edge symbol end:'lockout_gen2'

   //=========================================================
   
   //Edge symbol: 'sync_switch_gen1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 608, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      

   })("sync_switch_gen1");
   //Edge symbol end:'sync_switch_gen1'

   //=========================================================
   
   //Edge symbol: 'sync_switch_gen2'
   (function(symbolName) {   
   
      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1118, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("sync_switch_gen2");
   //Edge symbol end:'sync_switch_gen2'

   //=========================================================
    
   //Edge symbol: 'arrow_volt_gen1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 250, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 500, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 750, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1128, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1255, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1500, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 131, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("arrow_volt_gen1");
   //Edge symbol end:'arrow_volt_gen1'

   //=========================================================
   
   //Edge symbol: 'arrow_watt_gen1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("arrow_watt_gen1");
   //Edge symbol end:'arrow_watt_gen1'

   //=========================================================
   
   //Edge symbol: 'arrow_amm_gen1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("arrow_amm_gen1");
   //Edge symbol end:'arrow_amm_gen1'

   //=========================================================
   
   //Edge symbol: 'arrow_freq_gen1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1804, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

     })("arrow_freq_gen1");
   //Edge symbol end:'arrow_freq_gen1'

   //=========================================================
   
   //Edge symbol: 'arrow_volt_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 250, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 500, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 750, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1116, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1255, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1500, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 123, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

   })("arrow_volt_gen2");
   //Edge symbol end:'arrow_volt_gen2'

   //=========================================================
   
   //Edge symbol: 'arrow_watt_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("arrow_watt_gen2");
   //Edge symbol end:'arrow_watt_gen2'

   //=========================================================
   
   //Edge symbol: 'arrow_amm_gen2'
   (function(symbolName) {   
   
      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1569, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 3012, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 3012, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      

   })("arrow_amm_gen2");
   //Edge symbol end:'arrow_amm_gen2'

   //=========================================================
   
   //Edge symbol: 'arrow_freq_gen2'
   (function(symbolName) {   
 
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1203, function(sym, e) {
         // insert code here
         sym.stop();
     

      });
      //Edge binding end

      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2501, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

   })("arrow_freq_gen2");
   //Edge symbol end:'arrow_freq_gen2'

   //=========================================================
   
   //Edge symbol: 'arrow_snc_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
      });
      //Edge binding end

   })("arrow_snc_gen2");
   //Edge symbol end:'arrow_snc_gen2'

   //=========================================================
   
   //Edge symbol: 'br_contr_gen1'
   (function(symbolName) {   
   
   })("br_contr_gen1");
   //Edge symbol end:'br_contr_gen1'

   //=========================================================
   
   //Edge symbol: 'br_contr_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1152, function(sym, e) {
         // insert code here
         
         sym.stop();
         

      });
      //Edge binding end

      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2057, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("br_contr_gen2");
   //Edge symbol end:'br_contr_gen2'

   //=========================================================
   
   //Edge symbol: 'lamp_white_sm2'
   (function(symbolName) {   
   
   })("lamp_white_sm2");
   //Edge symbol end:'lamp_white_sm2'

   //=========================================================
   
   //Edge symbol: 'lamp_white_sm3'
   (function(symbolName) {   
   
   })("lamp_white_sm3");
   //Edge symbol end:'lamp_white_sm3'

   //=========================================================
   
   //Edge symbol: 'lamp_white_sm4'
   (function(symbolName) {   
   
   })("lamp_white_sm4");
   //Edge symbol end:'lamp_white_sm4'

   //=========================================================
   
   //Edge symbol: 'lamp_white_sm5'
   (function(symbolName) {   
   
   })("lamp_white_sm5");
   //Edge symbol end:'lamp_white_sm5'

   //=========================================================
   
   //Edge symbol: 'lamp_white_lg2'
   (function(symbolName) {   
   
   })("lamp_white_lg2");
   //Edge symbol end:'lamp_white_lg2'

   //=========================================================
   
   //Edge symbol: 'man_vol_contr_gen1'
   (function(symbolName) {   
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 530, function(sym, e) {
         // insert code here
         // Go to a label or specific time and stop. For example:
         // sym.stop(500); or sym.stop("myLabel");
        sym.stop();
      
      });
      //Edge binding end

      

   })("man_vol_contr_gen1");
   //Edge symbol end:'man_vol_contr_gen1'

   //=========================================================
   
   //Edge symbol: 'man_vol_contr_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 672, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("man_vol_contr_gen2");
   //Edge symbol end:'man_vol_contr_gen2'

   //=========================================================
   
   //Edge symbol: 'trig_black_sm_gen1'
   (function(symbolName) {   
   
   })("trig_black_sm_gen1");
   //Edge symbol end:'trig_black_sm_gen1'

   //=========================================================
   
   //Edge symbol: 'trig_black_sm_gen2'
   (function(symbolName) {   
   
   })("trig_black_sm_gen2");
   //Edge symbol end:'trig_black_sm_gen2'

   //=========================================================
   
   //Edge symbol: 'trig_black_sm_gen2_2'
   (function(symbolName) {   
   
   })("trig_black_sm_gen2_2");
   //Edge symbol end:'trig_black_sm_gen2_2'

   //=========================================================
   
   //Edge symbol: 'volt_switch_gen1'
   (function(symbolName) {   
   
   })("volt_switch_gen1");
   //Edge symbol end:'volt_switch_gen1'

   //=========================================================
   
   //Edge symbol: 'auto_switch_gen1'
   (function(symbolName) {   
   
   })("auto_switch_gen1");
   //Edge symbol end:'auto_switch_gen1'

   //=========================================================
   
   //Edge symbol: 'amm_switch_gen1'
   (function(symbolName) {   
   
   })("amm_switch_gen1");
   //Edge symbol end:'amm_switch_gen1'

   //=========================================================
   
   //Edge symbol: 'heat_switch_gen1'
   (function(symbolName) {   
      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1005, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("heat_switch_gen1");
   //Edge symbol end:'heat_switch_gen1'

   //========================================================
   
   //Edge symbol: 'volt_switch_gen2'
   (function(symbolName) {   
   
   })("volt_switch_gen2");
   //Edge symbol end:'volt_switch_gen2'

   //=========================================================
   
   //Edge symbol: 'sync_mode_sw_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1411, function(sym, e) {
         // insert code here
      });
      //Edge binding end

   })("sync_mode_sw_gen2");
   //Edge symbol end:'sync_mode_sw_gen2'

   //=========================================================
   
   //Edge symbol: 'amm_sw_gen2'
   (function(symbolName) {   
   
   })("amm_sw_gen2");
   //Edge symbol end:'amm_sw_gen2'

   //=========================================================
   
   //Edge symbol: 'heat_sw_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 997, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 35, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

   })("heat_sw_gen2");
   //Edge symbol end:'heat_sw_gen2'

   //=========================================================
   
   //Edge symbol: 'man_volt_gen2'
   (function(symbolName) {   
   
      Symbol.bindElementAction(compId, symbolName, "${man_volt_gen2}", "click", function(sym, e) {
         // insert code for mouse click here
         
      });
      //Edge binding end

   })("man_volt_gen2");
   //Edge symbol end:'man_volt_gen2'

   //=========================================================
    //Edge symbol: 'light_green_gen1_1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1010, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

    

   })("light_green_gen1_1");
   //Edge symbol end:'light_green_gen1_1'

   //=========================================================
   
   //Edge symbol: 'light_green_gen2_1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1088, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("light_green_gen2_1");
   //Edge symbol end:'light_green_gen2_1'
   
   //=========================================================
   
   //Edge symbol: 'light_red_gen1_1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1058, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 16, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("light_red_gen1_1");
   //Edge symbol end:'light_red_gen1_1'

   //=========================================================
   
   //Edge symbol: 'light_red_gen2_1'
   (function(symbolName) {   
   
   })("light_red_gen2_1");
   //Edge symbol end:'light_red_gen2_1'

   //=========================================================
   
   //Edge symbol: 'light_yellow_gen1_1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

    

   })("light_yellow_gen1_1");
   //Edge symbol end:'light_yellow_gen1_1'

   //=========================================================
   
   //Edge symbol: 'light_yellow_gen2_1'
   (function(symbolName) {   
   
   })("light_yellow_gen2_1");
   //Edge symbol end:'light_yellow_gen2_1'

   //=========================================================
   
   //Edge symbol: 'droop_adj_gen1'
   (function(symbolName) {   
   
   })("droop_adj_gen1");
   //Edge symbol end:'droop_adj_gen1'

   //=========================================================
   
   //Edge symbol: 'droop_switch_gen1'
   (function(symbolName) {   
   
   })("droop_switch_gen1");
   //Edge symbol end:'droop_switch_gen1'

   //=========================================================
   
   //Edge symbol: 'droop_switch_gen2'
   (function(symbolName) {   
   
   })("droop_switch_gen2");
   //Edge symbol end:'droop_switch_gen2'

   //=========================================================
   
   //Edge symbol: 'rheo_speed_gen1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1997, function(sym, e) {
         // insert code here
         sym.play(0);

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 199, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 457, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 888, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1279, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1736, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1069, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 694, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1524, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("rheo_speed_gen1");
   //Edge symbol end:'rheo_speed_gen1'

   //=========================================================
   
   //Edge symbol: 'rheo_volt_gen2'
   (function(symbolName) {   
   
   })("rheo_volt_gen2");
   //Edge symbol end:'rheo_volt_gen2'

   //=========================================================
   
   //Edge symbol: 'rheo_speed_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 199, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 457, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 694, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 888, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1069, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1279, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1524, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1736, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1997, function(sym, e) {
         // insert code here
         sym.play(0);

      });
      //Edge binding end

   })("rheo_speed_gen2");
   //Edge symbol end:'rheo_speed_gen2'

   //=========================================================
   
    //Edge symbol: 'rpm_gen1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
      });
      //Edge binding end

   })("rpm_gen1");
   //Edge symbol end:'rpm_gen1'

   //=========================================================
   
   //Edge symbol: 'rpm_gen2'
   (function(symbolName) {   
   
   })("rpm_gen2");
   //Edge symbol end:'rpm_gen2'

   //=========================================================
   
  
  //Edge symbol: 'engineSYM'
   (function(symbolName) {   

      Symbol.bindTimelineAction(compId, symbolName, "Default Timeline", "play", function(sym, e) {
         // insert code to be run at timeline play here
          //console.log("play engineSYM ");
         sym.getComposition().getStage().getSymbol("engineSYM").getSymbol("slide_panel").getSymbol("startengine1SYM").play();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();
      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${switchbtn}", "click", function(sym, e) {
         // insert code for mouse click here
    
         sym.getSymbol("switchbtn").$("viewSBbtn").css("background-color","white");
         
         // Hide an element 
         sym.getSymbolElement().hide();
         
      });
      //Edge binding end


   })("engineSYM");
   //Edge symbol end:'engineSYM'

   //=========================================================
   //Edge symbol: 'slide_panel'
   (function(symbolName) {   
      
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 543, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().gen1.incRPMs1(100);
      });
      //Edge binding end
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2005, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().gen1.incRPMs1(500);
      
      });
      //Edge binding end
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2974, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().gen1.incRPMs1(300);
      
      });
      //Edge binding end
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 3785, function(sym, e) {
         sym.getComposition().getStage().gen1.incRPMs1(300);
      
      });
      //Edge binding end

   })("slide_panel");
   //Edge symbol end:'slide_panel'

   //=========================================================
   
   
  
   
   //Edge symbol: 'circuitBreaker1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 670, function(sym, e) {
         
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1538, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("circuitBreaker1");
   //Edge symbol end:'circuitBreaker1'

   //=========================================================
   
   //Edge symbol: 'synchLights'
   (function(symbolName) {   
   
   })("synchLights");
   //Edge symbol end:'synchLights'

   //=========================================================
   
   //Edge symbol: 'gen2light'
   (function(symbolName) {   
   
   })("gen2light");
   //Edge symbol end:'gen2light'

   //=========================================================
   
   //Edge symbol: 'gen1light'
   (function(symbolName) {   
   
   })("gen1light");
   //Edge symbol end:'gen1light'

   //=========================================================
   
   //Edge symbol: 'groundLights'
   (function(symbolName) {   
   
   })("groundLights");
   //Edge symbol end:'groundLights'

   //=========================================================
   
   //Edge symbol: 'RPMgages'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 56, function(sym, e) {
         // insert code here
         

      });
      //Edge binding end

   })("RPMgages");
   //Edge symbol end:'RPMgages'

   //=========================================================
   
   //Edge symbol: 'slide_panel2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 535, function(sym, e) {
         // insert code here
         
         sym.$("rpmText").html("100");
         
         sym.getComposition().getStage().getSymbol("RPMgages").$("rpm1").html("100");

      });
         //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2005, function(sym, e) {
         // insert code here
         sym.$("rpmText").html("700");
         
         
         sym.getComposition().getStage().getSymbol("RPMgages").$("rpm1").html("700");

      });
         //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2974, function(sym, e) {
         // insert code here
         sym.$("rpmText").html("900");
         
         sym.getComposition().getStage().getSymbol("RPMgages").$("rpm1").html("900");

      });
         //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 3785, function(sym, e) {
         sym.$("rpmText").html("1200");
         
         sym.getComposition().getStage().getSymbol("RPMgages").$("rpm1").html("1200");

      });
         //Edge binding end

      Symbol.bindTimelineAction(compId, symbolName, "Default Timeline", "play", function(sym, e) {
         // insert code to be run at timeline play here
		 //console.log("sotp slide_panel2");
        sym.stop();

      });
         //Edge binding end

      })("slide_panel2");
   //Edge symbol end:'slide_panel2'

   //=========================================================

   //Edge symbol: 'gages1'
   (function(symbolName) {  

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 3015, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("gages1");
   //Edge symbol end:'gages1'

   //=========================================================

   //Edge symbol: 'engineRoom'
   (function(symbolName) {   
   

      

      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 299, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end


      

      

      

      

   })("engineRoom");
   //Edge symbol end:'engineRoom'

   //=========================================================
   
   //Edge symbol: 'slide_panel_2'
   (function(symbolName) {   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 599, function(sym, e) {
         // insert code here
         
         
         sym.getComposition().getStage().gen2.incRPMs2(100);

      });
      //Edge binding end
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1859, function(sym, e) {
         // insert code here
         
         sym.getComposition().getStage().gen2.incRPMs2(500);

      });
      //Edge binding end
      
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2463, function(sym, e) {
         // insert code here
         
         
         sym.getComposition().getStage().gen2.incRPMs2(300);

      });
      //Edge binding end

   })("slide_panel_2");
   //Edge symbol end:'slide_panel_2'

   //=========================================================
   
   //Edge symbol: 'startengine2'
   (function(symbolName) {   
   
      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1201, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("startengine2");
   //Edge symbol end:'startengine2'

   //=========================================================
   
   //Edge symbol: 'groundTestbtn'
   (function(symbolName) {   
   
   })("groundTestbtn");
   //Edge symbol end:'groundTestbtn'

   //=========================================================
   
   //Edge symbol: 'startengine1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2010, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      

   })("startengine1");
   //Edge symbol end:'startengine1'

   //=========================================================
   
   //Edge symbol: 'engine1'
   (function(symbolName) {   
   
   })("engine1");
   //Edge symbol end:'engine1'

   //=========================================================
   
 
   //Edge symbol: 'syncharrow'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 371, function(sym, e) {
         // insert code here
         
         sym.play("FAST");

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 33, function(sym, e) {
         // insert code here
         
         // Play the timeline backwards from a label or specific time. For example:
         // sym.playReverse(500); or sym.playReverse("myLabel");
         sym.playReverse("R_FAST");

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 192, function(sym, e) {
         // insert code here
         
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").show();
          
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 225, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         sym.getComposition().getStage().synch.setSynched(false);

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1294, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1220, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
          

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 5700, function(sym, e) {
         // insert code here
         
         sym.getComposition().getStage().synch.setSynched(false);
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 4646, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").show();
         sym.getComposition().getStage().synch.setSynched(true);

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1740, function(sym, e) {
         // insert code here
         sym.play("MEDIUM");

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 7983, function(sym, e) {
         // insert code here
         sym.play("SLOW");

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 801, function(sym, e) {
         // insert code here
         
         // Play the timeline at a label or specific time. For example:
         // sym.play(500); or sym.play("myLabel");
         sym.playReverse("R_MEDIUM");

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2494, function(sym, e) {
         // insert code here
         
         sym.playReverse("R_SLOW");

      });
      //Edge binding end

      

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 180, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         sym.getComposition().getStage().synch.setSynched(false);

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 214, function(sym, e) {
         // insert code here
         
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 54, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().synch.setSynched(false);
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 841, function(sym, e) {
         // insert code here
         
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         sym.getComposition().getStage().synch.setSynched(false);

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1229, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").show();
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1306, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").show();
          

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1700, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().synch.setSynched(false);
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 2525, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().synch.setSynched(false);
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 4607, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().synch.setSynched(false);
         
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 5617, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").show();
         sym.getComposition().getStage().synch.setSynched(true);

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 7765, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().synch.setSynched(false);
         
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 356, function(sym, e) {
         // insert code here
         sym.getComposition().getStage().synch.setSynched(false);
         sym.getComposition().getStage().getSymbol("synchLights").$("dimmers").hide();
         

      });
      //Edge binding end

   })("syncharrow");
   //Edge symbol end:'syncharrow'

   //=========================================================
   
   //Edge symbol: 'acellerate1'
   (function(symbolName) {   
   
   })("acellerate1");
   //Edge symbol end:'acellerate1'

   //=========================================================
   
   //Edge symbol: 'decellerate1'
   (function(symbolName) {   
   
   })("decellerate1");
   //Edge symbol end:'decellerate1'

   //=========================================================
   
   //Edge symbol: 'enginelights'
   (function(symbolName) {   
   
   })("enginelights");
   //Edge symbol end:'enginelights'

   //=========================================================
   
   //Edge symbol: 'droop_gen1'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 182, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 933, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("droop_gen1");
   //Edge symbol end:'droop_gen1'

   //=========================================================
   
   //Edge symbol: 'speed_control2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 109, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 1421, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("speed_control2");
   //Edge symbol end:'speed_control2'

   //=========================================================
   
   //Edge symbol: 'engine2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 0, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

   })("engine2");
   //Edge symbol end:'engine2'

   //=========================================================
   
   //Edge symbol: 'simulator'
   (function(symbolName) {   
   
   })("simulator");
   //Edge symbol end:'simulator'

   //=========================================================
   
   //Edge symbol: 'start1btn'
   (function(symbolName) {   
   
      Symbol.bindElementAction(compId, symbolName, "${startengine1}", "click", function(sym, e) {
         

      });
      //Edge binding end

   })("start1btn");
   //Edge symbol end:'start1btn'

   //=========================================================
   
   //Edge symbol: 'start2btn'
   (function(symbolName) {   
   
      Symbol.bindElementAction(compId, symbolName, "${startengine2SYM}", "click", function(sym, e) {
         

      });
      //Edge binding end

   })("start2btn");
   //Edge symbol end:'start2btn'

   //=========================================================
   
   //Edge symbol: 'viewEngPanbtn'
   (function(symbolName) {   
   
   })("viewEngPanbtn");
   //Edge symbol end:'viewEngPanbtn'

   //=========================================================
   
   //Edge symbol: 'drrop_gen2'
   (function(symbolName) {   
   
      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 547, function(sym, e) {
         // insert code here
         sym.stop();

      });
      //Edge binding end

      Symbol.bindTriggerAction(compId, symbolName, "Default Timeline", 106, function(sym, e) {
         // insert code here
         
         sym.stop();

      });
      //Edge binding end

   })("drrop_gen2");
   //Edge symbol end:'drrop_gen2'

})(window.jQuery || AdobeEdge.$, AdobeEdge, "EDGE-55308311");