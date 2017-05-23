var COUNTRY_ISO_CODE_REGEX = /^(AFG|ALA|ALB|DZA|ASM|AND|AGO|AIA|ATA|ATG|ARG|ARM|ABW|AUS|AUT|AZE|BHS|BHR|BGD|BRB|BLR|BEL|BLZ|BEN|BMU|BTN|BOL|BES|BIH|BWA|BVT|BRA|IOT|VGB|BRN|BGR|BFA|BDI|CPV|KHM|CMR|CAN|CYM|CAF|TCD|CHL|CHN|HKG|MAC|CXR|CCK|COL|COM|COG|COK|CRI|CIV|HRV|CUB|CUW|CYP|CZE|PRK|COD|DNK|DJI|DMA|DOM|ECU|EGY|SLV|GNQ|ERI|EST|ETH|FLK|FRO|FJI|FIN|FRA|GUF|PYF|ATF|GAB|GMB|GEO|DEU|GHA|GIB|GRC|GRL|GRD|GLP|GUM|GTM|GGY|GIN|GNB|GUY|HTI|HMD|VAT|HND|HUN|ISL|IND|IDN|IRN|IRQ|IRL|IMN|ISR|ITA|JAM|JPN|JEY|JOR|KAZ|KEN|KIR|KWT|KGZ|LAO|LVA|LBN|LSO|LBR|LBY|LIE|LTU|LUX|MDG|MWI|MYS|MDV|MLI|MLT|MHL|MTQ|MRT|MUS|MYT|MEX|FSM|MCO|MNG|MNE|MSR|MAR|MOZ|MMR|NAM|NRU|NPL|NLD|NCL|NZL|NIC|NER|NGA|NIU|NFK|MNP|NOR|OMN|PAK|PLW|PAN|PNG|PRY|PER|PHL|PCN|POL|PRT|PRI|QAT|KOR|MDA|REU|ROU|RUS|RWA|BLM|SHN|KNA|LCA|MAF|SPM|VCT|WSM|SMR|STP|SAU|SEN|SRB|SYC|SLE|SGP|SXM|SVK|SVN|SLB|SOM|ZAF|SGS|SSD|ESP|LKA|PSE|SDN|SUR|SJM|SWZ|SWE|CHE|SYR|TJK|THA|MKD|TLS|TGO|TKL|TON|TTO|TUN|TUR|TKM|TCA|TUV|UGA|UKR|ARE|GBR|TZA|UMI|USA|VIR|URY|UZB|VUT|VEN|VNM|WLF|ESH|YEM|ZMB|ZWE)$/i;

var WDCT_Validator = {
   validatingColumn: "0",
   columns: {
	   "1" : {
		      "VALIDATIONS" : {
		    	              "find-blank" :{
		    	            	      "TYPE" : "REGEX"
		    	            	      ,"VALIDATIONRULE" : /^\s*$/
			    	                  ,"MSG" : "Value cannot be blank"
			    	                  ,"MENUITEMLABEL" : "Find Blank Values"
			    	                  ,"LOOKUPINDEX": ""	  
		                           },
		                       "find-dup" : {
		                    	    
		                    	          "TYPE" : "DUPLICATE"
			    	            	      ,"VALIDATIONRULE" : /^\s*$/
				    	                  ,"MSG" : "Value cannot be dublicate"
				    	                  ,"MENUITEMLABEL" : "Find Duplicate Values"
				    	                  ,"LOOKUPINDEX": ""
		                           }    
		      }
		     
	   },
	   "4" : {
		      "VALIDATIONS" : {
		    	              "find-blank" :{
		    	            	      "TYPE" : "REGEX"
		    	            	      ,"VALIDATIONRULE" : /^\s*$/
			    	                  ,"MSG" : "Value cannot be blank"
			    	                  ,"MENUITEMLABEL" : "Find Blank Values"
			    	                  ,"LOOKUPINDEX": ""	  
		                           },
		                           "find-lookup-sheet-value" : {
									   "TYPE" : "JSFUNCTION_LOOKUP"
									   ,"VALIDATIONRULE" : "VALIDATE_LOOUPSHEETDATA"
									   ,"MSG" : "Value should be in related sheet"
			    	                   ,"MENUITEMLABEL" : "Find invalid not in original sheet"
			    	                   ,"LOOKUPINDEX": "" 	   
									}
                     
		      }
		     
	   }
		
   }	
}














var WDCT_LookUpConfig = {
		"SUPERVISORY ORGANIZATIONS" : {
			"4": {
				"sheet" : "LOCATIONS",
				"col": 1,
				"display": { mergeWithCol : 2} 
			}
		}
}



/** NOT NEEDED ANY MORE - REMOVE AFTER USING BELOW REGEX FOR ACTUAL VALIDATORS ***/


/**
var WDCT_REGEX = {
		"MM/DD/YYYY" : /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/
		,"NUMERICAL" : /^\d+$/
		,"Y/N" : /(Y|N)$/i
		,"NUMBER (16,6)" : /^\$?\d{0,16}(\.\d{0,6})?$/
		,"NUMBER (MONTHS PAY IN A 12 MONTH PERIOD)" : /^(1[0-2]|[1-9])$/
		,"TEXT (Y or N)" : /(Y|N)$/i
		,"NUMBER (21,6)" : /^\$?\d{0,21}(\.\d{0,6})?$/
		,"TEXT or NUMERIC" : ""
		,"LOCAL CURRENCY" : ""
		,"DATE1" : /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/
		,"DATE" : /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19[0-9][0-9]|20[0-9][0-9]))*$/
		,"NUMBER (WEEKS IN A 12-MONTH PERIOD)" : /^[1-9]$|^[1-4]\d$|^5[0-2]$/
		,"NUMBER (DAYS IN A 12-MONTH PERIOD)" : ""
		,"NUMBER (1, 2 OR 3)" : /^(?:1|2|3)$/
		,"NUMBER (26,6)" : /^\$?\d{0,26}(\.\d{0,6})?$/
		,"NUMBER (HOURS IN A WEEK PERIOD)" : /^(?:36[0-5]|3[0-5][0-9]|[12][0-9][0-9]|[1-9][0-9]|[1-9])$/
		,"TEXT" : ""
		,"ISO" : ""
		,"TEXT (% or AMOUNT)" : /^\s*(\d{0,2})(\.?(\d*))?\s*\%?\s*$/
		,"EMPL_ID" : ""
		,"CURRENCY" : /^(AED|AFN|ALL|AMD|ANG|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BGN|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYR|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HRK|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LTL|LVL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRO|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLL|SOS|SRD|SSP|STD|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|USS|UYI|UYU|UZS|VEF|VND|VUV|WST|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XDR|XFU|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWL)$/
}
**/
/**
var WDCT_HEADER_REGEX = {
		"EMPLOYEE'S STATUS: ACTIVE, TERMINATED, ON LEAVE" : /(Active|Terminated|On Leave)$/i,
		"COUNTRY ISO CODE" : /^(AFG|ALA|ALB|DZA|ASM|AND|AGO|AIA|ATA|ATG|ARG|ARM|ABW|AUS|AUT|AZE|BHS|BHR|BGD|BRB|BLR|BEL|BLZ|BEN|BMU|BTN|BOL|BES|BIH|BWA|BVT|BRA|IOT|VGB|BRN|BGR|BFA|BDI|CPV|KHM|CMR|CAN|CYM|CAF|TCD|CHL|CHN|HKG|MAC|CXR|CCK|COL|COM|COG|COK|CRI|CIV|HRV|CUB|CUW|CYP|CZE|PRK|COD|DNK|DJI|DMA|DOM|ECU|EGY|SLV|GNQ|ERI|EST|ETH|FLK|FRO|FJI|FIN|FRA|GUF|PYF|ATF|GAB|GMB|GEO|DEU|GHA|GIB|GRC|GRL|GRD|GLP|GUM|GTM|GGY|GIN|GNB|GUY|HTI|HMD|VAT|HND|HUN|ISL|IND|IDN|IRN|IRQ|IRL|IMN|ISR|ITA|JAM|JPN|JEY|JOR|KAZ|KEN|KIR|KWT|KGZ|LAO|LVA|LBN|LSO|LBR|LBY|LIE|LTU|LUX|MDG|MWI|MYS|MDV|MLI|MLT|MHL|MTQ|MRT|MUS|MYT|MEX|FSM|MCO|MNG|MNE|MSR|MAR|MOZ|MMR|NAM|NRU|NPL|NLD|NCL|NZL|NIC|NER|NGA|NIU|NFK|MNP|NOR|OMN|PAK|PLW|PAN|PNG|PRY|PER|PHL|PCN|POL|PRT|PRI|QAT|KOR|MDA|REU|ROU|RUS|RWA|BLM|SHN|KNA|LCA|MAF|SPM|VCT|WSM|SMR|STP|SAU|SEN|SRB|SYC|SLE|SGP|SXM|SVK|SVN|SLB|SOM|ZAF|SGS|SSD|ESP|LKA|PSE|SDN|SUR|SJM|SWZ|SWE|CHE|SYR|TJK|THA|MKD|TLS|TGO|TKL|TON|TTO|TUN|TUR|TKM|TCA|TUV|UGA|UKR|ARE|GBR|TZA|UMI|USA|VIR|URY|UZB|VUT|VEN|VNM|WLF|ESH|YEM|ZMB|ZWE)$/i
}
**/


var WDCT_RELATEDVALIDATIONS = {
	"4" : {
	   "LOOKUPINDEX": "252",
	   "TYPE" : "DATECOMPARE",
	   "VALIDATIONRULE" : "LESSTHAN"   
	}, 
	"252" : {
		   "LOOKUPINDEX": "4",
		   "TYPE" : "DATECOMPARE",
		   "VALIDATIONRULE" : "GREATERTHAN"   
		},
	"33" : {
		"LOOKUPINDEX" : "32",
		"TYPE" : "MAP",
		"VALIDATIONRULE" : {
			"USA": 1,
			"IND" : 91,
			"GBR" : 44
		}
	},

	"34" : {
		"LOOKUPINDEX" : "32",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA": /^\d{3}$/,
			"IND" : /^\d{2,4}$/,
			"GBR" : /^[0]?\d{2,5}$/
		}
	},

	"35" : {
		"LOOKUPINDEX" : "32",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA": /^(\d{3})[-\.]?(\d{4})$/,
			"IND" : /^\d{6,10}$/,
			"GBR" : /^\d{4,8}$/
		}
	},

	"55" : {
		"LOOKUPINDEX" : "54",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA" : /.*\S.*/,
			"IND" : /.*\S.*/,
			"GBR" : /.*\S.*/
		}
	},

	"56" : {
		"LOOKUPINDEX" : "54",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA" : /.*\S.*/,
			"IND" : /.*\S.*/,
			"GBR" : /.*\S.*/
		}
	},

	"57" : {
		"LOOKUPINDEX" : "54",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA" : /^\s+$|^$/,
			"IND" : /.*\S.*/,
			"GBR" : /.*\S.*/
		}
	},

	"58" : {
		"LOOKUPINDEX" : "54",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA" : /^\s+$|^$/,
			"IND" : /^\s+$|^$/,
			"GBR" : /^\s+$|^$/
		}
	},

	"59" : {
		"LOOKUPINDEX" : "54",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA" : /.*\S.*/,
			"IND" : /.*\S.*/,
			"GBR" : /.*\S.*/
		}
	},

	"61" : {
		"LOOKUPINDEX" : "54",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA" : /USA-[A-Z]{2}/,
			"IND" : /IND-[A-Z]{2}/,
			"GBR" : /^\s+$|^$/
		}
	},

	"63" : {
		"LOOKUPINDEX" : "54",
		"TYPE" : "MAP_REGEX",
		"VALIDATIONRULE" : {
			"USA" : /^\d{5}(-\d{4})?$/,
			"IND" : /^\d{6}$/,
			"GBR" : /^(GIR ?0AA|[A-PR-UWYZa-pr-uwyz]([0-9]{1,2}|([A-HK-Ya-hk-y][0-9]([0-9ABEHMNPRV-Yabehmnprv])?)|[0-9][A-HJKPS-UWa-hjkps-uw]) ?[0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2})$/
		}
	},
}