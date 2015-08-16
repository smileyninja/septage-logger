
septageLogger.controller('UserCtrl',['$scope', '$routeParams', '$location', '$anchorScroll', 'userService', 'companyService', 'truckService', 'spreadSiteService', 'logoutService', 'reportService','flash',
    function($scope, $routeParams, $location, $anchorScroll, userService, companyService, truckService, spreadSiteService, logoutService, reportService, flash){
    
    $scope.yearList = ['2015', '2016', '2017', '2018', '2019', '2020'];
    $scope.selectedYear = new Date().getFullYear().toString()
    
    $scope.$watch('selectedUser', function(newSelectedUser){
        console.log(newSelectedUser);
        if(newSelectedUser === "" || newSelectedUser === undefined || newSelectedUser === null){
            // clear out the form inputs
            $scope.newUser = {};
            document.getElementById('username').disabled = false;
            document.getElementById('company').disabled = false;
            $scope.selectedCompany = "";
        } else {
            userService.getUser(newSelectedUser)
                .then(function(returnData){
                    //console.log("I'm here!");
                    //console.log(returnData);
                    //console.log($scope.newUser);
                    $scope.newUser.username = returnData.data.username;
                    $scope.newUser.password = "";
                    $scope.newUser.email = returnData.data.email;
                    $scope.newUser.type = returnData.data.type;
                    $scope.selectedCompany = returnData.data.company;
                    if(returnData.data.active){
                        $scope.newUser.active = 'yes';
                    } else {
                        $scope.newUser.active = 'no';
                    }
                    document.getElementById('username').disabled = true;
                    document.getElementById('company').disabled = true;
                    
                }, function(err){
                    console.log("problem");
                });

        }
    });

    $scope.$watch('selectedCompany', function(newSelectedCompany){
        if(newSelectedCompany === "" || newSelectedCompany === undefined){
            // clear out the form inputs
            $scope.company = {};
        } else {
            companyService.getCompany(newSelectedCompany)
                .then(function(returnData){
                    $scope.company.name = returnData.data.name;
                    $scope.company.phone = returnData.data.phone;
                    if(returnData.data.active){
                        $scope.company.active = 'yes';
                    } else {
                        $scope.company.active = 'no';
                    }
                }, function(err){
                    console.log("problem");
                });

        }
    });

    $scope.$watch('selectedTruck', function(newSelectedTruck){
        if(newSelectedTruck === "" || newSelectedTruck === undefined){
            // clear out the form inputs
            $scope.truck = {};
        } else {
            truckService.getTruck(newSelectedTruck)
                .then(function(returnData){
                    $scope.truck.nickname = returnData.data.nickname;
                }, function(err){
                    console.log("problem");
                });

        }
    });

    userService.getUser($routeParams.username)
        .then(function(data){
            $scope.username = data.data.username;
            $scope.accountType = data.data.type;
            $scope.approvedDrivers = [];
            $scope.approvedCompanies = [];
            $scope.report = {};
            if($scope.accountType !== 'admin') {
                $scope.companyList = [];
                $scope.companyList.push(data.data.company);
                reloadSpreadSiteList();
            } else {
                fillCompanyList();
                reloadSpreadSiteList();
                fillApprovedCompanyList();
            }

            fillInUserList();
            reloadTruckList();
            fillApprovedDriversList();
            //reloadCollectionList();
        }, function(error){
            console.log("problem");
        });





    $scope.deleteUser = function(){
        if($scope.userList.indexOf($scope.newUser.username) !== -1){
            // send delete request
            userService.deleteUser($scope.newUser.username)
                .then(function(data){
                    fillInUserList();
                    clearFields();
                    fillApprovedDriversList();
                    addFlash('user deleted!');
                }, function(error){
                    console.log("problem");
                });
        }
    };

    $scope.deleteTruck = function(vin){
        truckService.deleteTruck(vin)
            .then(function(data){
                reloadTruckList();
                clearTruckFields();
                addFlash('truck deleted!');
            }, function(error){
                console.log("problem");
            });
    };
    
    $scope.selectTruck = function(vin){
        $scope.newTruck = {};
        truckService.getTruck(vin)
                .then(function(returnData){
                    //console.log("test");
                    console.log(returnData);
                    $scope.selectedCompany = returnData.data.company;
                    $scope.newTruck.vin = returnData.data._id;
                    $scope.newTruck.capacity = returnData.data.capacity;
                    $scope.newTruck.tag = returnData.data.license;
                    $scope.newTruck.nickname = returnData.data.nickname;
                    $scope.newTruck.make = returnData.data.make;
                    $scope.newTruck.model = returnData.data.model;
                    $scope.newTruck.year = returnData.data.year;
                    $scope.newTruck.color = returnData.data.color;
                    $scope.newTruck.stat = returnData.data.stat;
                    $scope.approvedDrivers.usernames = {};
                    for (var i=0; i < returnData.data.approvedDrivers.length ;i++){
                        $scope.approvedDrivers.usernames[returnData.data.approvedDrivers[i]] = true;
                    }
                    
                }, function(err){
                    console.log("problem");
                });
        //$location.hash('scrollhere');
        $anchorScroll();
    };

    $scope.editSpreadSite = function(id){
        spreadSiteService.getSpreadSite(id)
            .then(function(data){
                console.log(data);
               $scope.spreadSiteForm = data.data;
            }, function(error){
                console.log(error);
            });
    };

    $scope.submitCompany = function(){
        companyService.createCompany($scope.company)
            .then(function(data){
                console.log(data);
                addFlash('company created!');
                $scope.clearCompanyFields();
                fillCompanyList();
            }, function(error){
                console.log(error);
                console.log("error");
                addFlash(error.data.message);
                $scope.clearCompanyFields();
                fillCompanyList();
            });
    };

    $scope.updateCompany = function(){
        console.log("Update company");
        console.log($scope.company);
        companyService.updateCompany($scope.company)
            .then(function(data){
                console.log(data);
                addFlash('Company updated.');
                $scope.clearCompanyFields();
                fillCompanyList();
            }, function(error){
                console.log("error");
                console.log(error);
            });
    };

    $scope.submitTruck = function(){
        var truckVins = [];
        var truck = $scope.newTruck;
        truck.company = $scope.selectedCompany;
        truck.approvedDrivers = [];
        for(var username in $scope.approvedDrivers.usernames){
            if($scope.approvedDrivers.usernames[username]){
                truck.approvedDrivers.push(username);
            }
        }
        
        $scope.trucks.forEach(function(element){
            truckVins.push(element._id);
        });
        
        if(truckVins.indexOf($scope.newTruck.vin) !== -1){
            truckService.updateTruck(truck)
            .then(function(data){
                addFlash('truck updated!');
                clearTruckFields();
                reloadTruckList();
            }, function(error){
                console.log("error");
            });
        }
        else {
            console.log("create truck");
            truckService.createTruck(truck)
            .then(function(data){
                console.log("truck created");
                addFlash('truck created!');
                clearTruckFields();
                reloadTruckList();
            }, function(error){
                console.log(error);
            });
        }
    };


    $scope.createUser = function(){
        var newUser = {};
        newUser = $scope.newUser;

        if($scope.newUser.active === 'yes'){
            newUser.active = true;
        } else {
            newUser.active = false;
        }
        if($scope.userList.indexOf($scope.newUser.username) !== -1 ){
            newUser.company = $scope.selectedCompany;
            //console.log(newUser);

            userService.updateUser(newUser)
                .then(function(data){
                    console.log("user updated");
                    addFlash('user updated!');
                    clearFields();
                }, function(error){
                    console.log("problem");
                });

        } else {
            newUser.company = $scope.selectedCompany;
            userService.createUser($scope.newUser)
                .then(function(data){
                    addFlash('user created!');
                    fillInUserList();
                    fillApprovedDriversList();
                    clearFields();
                }, function(error){
                    console.log("problem");
                });
        }
    };

    $scope.submitSpreadSite = function(){
        var spreadSite = $scope.spreadSiteForm;

        spreadSite.approvedCompanies = [];
        console.log($scope.approvedCompanies);
        for(var _id in $scope.approvedCompanies.companies){
            if($scope.approvedCompanies.companies[_id]){
                spreadSite.approvedCompanies.push(_id);
            }
        }
        if (spreadSite._id){
            spreadSiteService.updateSpreadSite(spreadSite)
            .then(function(data){
                //console.log(data);
                addFlash('spreadsite updated!');
                clearSpreadSiteFields();
                reloadSpreadSiteList();
            }, function(error){
                console.log("error");
            });
        } else {
        
        spreadSiteService.createSpreadSite(spreadSite)
            .then(function(data){
                //console.log(data);
                addFlash('spreadsite created!');
                clearSpreadSiteFields();
                reloadSpreadSiteList();
            }, function(error){
                console.log("error");
            });
        }
    };

    $scope.editSite = function(spreadSite){
        //console.log("editSite");
        //console.log(spreadSite)
        $scope.spreadSiteForm = spreadSite;
        $scope.approvedCompanies.companies = {};
        for (var i=0; i < spreadSite.approvedCompanies.length; i++){
            console.log(spreadSite.approvedCompanies[i]);
                $scope.approvedCompanies.companies[spreadSite.approvedCompanies[i]._id] = true;
            }
    };

    function fillApprovedDriversList(){
        $scope.drivers = [];
        userService.getUserList()
            .then(function(list){
                list.data.map(function(driver){
                    //console.log(driver);
                    $scope.drivers.push(driver._id);
                })
            }, function(error){
                console.log(error);
            });
    }

    function fillCompanyList(){
        $scope.companyList = [];
        companyService.getCompanyList()
            .then(function(res){
                res.data.map(function(company){
                    $scope.companyList.push(company.name);
                });
            }, function(error){
                console.log(error);
            });
    }

    function fillApprovedCompanyList(){
        $scope.approvedCompaniesList = [];
        companyService.getCompanyList()
            .then(function(res){
                res.data.map(function(company){
                    $scope.approvedCompaniesList.push(company);
                });
            }, function(error){
                console.log(error);
            });
    }


    function reloadTruckList(){
        $scope.trucks = [];
        truckService.getTruckList()
            .then(function(response){
                response.data.map(function(truck){
                    //console.log(truck);
                    $scope.trucks.push(truck);
                });
            }, function(error){
                console.log(error);
            });
    }

    function reloadSpreadSiteList(){
        $scope.spreadSites = [];
        console.log('spreadsite list is loading');
        spreadSiteService.getSpreadSiteList()
            .then(function(response){
                response.data.map(function(spreadSite){
                    companyService.getCompanyList()
                        .then(function(res){
                            for(var x=0; x<spreadSite.approvedCompanies.length; x++){
                                for(var y=0; y<res.data.length; y++){
                                    if(spreadSite.approvedCompanies[x] === res.data[y]._id){
                                        spreadSite.approvedCompanies[x] = res.data[y];
                                    }
                                }
                            }

                            $scope.spreadSites.push(spreadSite);
                        }, function(error){
                            console.log(error);
                        });
                });
            }, function(error){
                console.log(error);
            });
    }

    function fillInUserList(){
        $scope.userList = [];
        userService.getUserList()
            .then(function(response){
                //console.log(response);
                response.data.map(function(user){
                    //console.log(user);
                    $scope.userList.push(user._id);
                    //console.log($scope.userList);
                });
            }, function(error){
                console.log("no users returned");
            });
    }

    function reloadCollectionList(){
        $scope.collections = [];
        reportService.getCollectionReport()
            .then(function(response){
                response.data.map(function(collection){
                    $scope.collections.push(collection);
                });
            }, function(error){
                console.log(error);
            });
    }

    $scope.refreshReport = function(){
        $scope.collections = [];
        document.getElementById('collectionPDF').disabled = false;
        document.getElementById('collectionCSV').disabled = false;
        //console.log("launch");
        //console.log($scope.report.beginDate);
        if (!$scope.report.beginDate){
            $scope.report.beginDate = new Date(new Date().setDate(new Date().getDate()-30));
        }
        if (!$scope.report.endDate){
            $scope.report.endDate = new Date();
        }
        reportService.getCollectionReport($scope.report.beginDate.toISOString(), $scope.report.endDate.toISOString())
            .then(function(response){
                response.data.map(function(collection){
                    $scope.collections.push(collection);
                });
                var destroy = true;
                while (destroy){
                    if (response.data.length === $scope.collections.length) {
                        destroy = false;
                        $scope.collectionExport = [];
                        $scope.collections.forEach(function(element){
                            var pusher = {};
                            pusher.vin = element.truckId;
                            pusher.lat = element.location.latitude;
                            pusher.lon = element.location.longitude;
                            pusher.company = element.companyName;
                            pusher.address = element.location.address;
                            pusher.volume = element.volume;
                            pusher.type = element.type;
                            pusher.time = new Date(element.createdTimeStamp).toDateString() + " " + new Date(element.createdTimeStamp).toLocaleTimeString();
                            $scope.collectionExport.push(pusher);
                        });
                    }
                }
            }, function(error){
                console.log(error);
            });
    };

    $scope.spreadsiteReport = function(){
        $scope.spreadCollections = [];
        document.getElementById('spreadsitePDF').disabled = false;
        if (!$scope.selectedYear){
            $scope.selectedYear = new Date().getFullYear().toString();
        }
        if (!$scope.selectedSpreadsite._id){
            $scope.selectedSpreadsite._id = null;
        }
        $scope.spreadTotals = [];
        var total = {
            total: 0,
            perLeft: '',
            cap: 0,
            Jan: 0,
            Feb: 0,
            Mar: 0,
            Q1: 0,
            Apr: 0,
            May: 0,
            Jun: 0,
            Q2: 0,
            Jul: 0,
            Aug: 0,
            Sep: 0,
            Q3: 0,
            Oct: 0,
            Nov: 0,
            Dec: 0,
            Q4: 0,
        };
        reportService.getSpreadsiteReport($scope.selectedYear, $scope.selectedSpreadsite._id)
            .then(function(response){
                var AAR = response.data[0].nitro / 0.0026;
                total.cap = (AAR * response.data[0].acres).toFixed();
                var prevYearSum = 0;
                var year = $scope.selectedYear;
                    
                for(var i=0;i<response.data.length;i++){
                    
                    var discharge  = response.data[i].dischargeTimeStamp;
                    
                    if (discharge >= new Date('January 1, ' + year).toISOString() && discharge < new Date('January 1, ' + (Number(year)+1)).toISOString()){
                        $scope.spreadCollections.push(response.data[i]);
                    }
                    
                    //Getting percent used
                    if (year == new Date().getFullYear()){
                        if (discharge >= new Date( new Date().getFullYear()-1, new Date().getMonth(), new Date().getDate() ).toISOString() && discharge < new Date().toISOString()){
                            prevYearSum += response.data[i].volume;
                        }
                    }
                    
                    //Gather total, montly and quarterly inf
                    if (discharge >= new Date('January 1, ' + year).toISOString() && discharge < new Date('February 1, ' + year).toISOString()) {
                        total.Jan += response.data[i].volume;
                        total.Q1 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('Februrary 1, ' + year).toISOString() && discharge < new Date('March 1, ' + year).toISOString()) {
                        total.Feb += response.data[i].volume;
                        total.Q1 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('March 1, ' + year).toISOString() && discharge < new Date('April 1, ' + year).toISOString()) {
                        total.Mar += response.data[i].volume;
                        total.Q1 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('April 1, ' + year).toISOString() && discharge < new Date('May 1, ' + year).toISOString()) {
                        total.Apr += response.data[i].volume;
                        total.Q2 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('May 1, ' + year).toISOString() && discharge < new Date('June 1, ' + year).toISOString()) {
                        total.May += response.data[i].volume;
                        total.Q2 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('June 1, ' + year).toISOString() && discharge < new Date('July 1, ' + year).toISOString()) {
                        total.Jun += response.data[i].volume;
                        total.Q2 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('July 1, ' + year).toISOString() && discharge < new Date('August 1, ' + year).toISOString()) {
                        total.Jul += response.data[i].volume;
                        total.Q3 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('August 1, ' + year).toISOString() && discharge < new Date('September 1, ' + year).toISOString()) {
                        total.Aug += response.data[i].volume;
                        total.Q3 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('September 1, ' + year).toISOString() && discharge < new Date('October 1, ' + year).toISOString()) {
                        total.Sep += response.data[i].volume;
                        total.Q3 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('October 1, ' + year).toISOString() && discharge < new Date('November 1, ' + year).toISOString()) {
                        total.Oct += response.data[i].volume;
                        total.Q4 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('November 1, ' + year).toISOString() && discharge < new Date('December 1, ' + year).toISOString()) {
                        total.Nov += response.data[i].volume;
                        total.Q4 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                    else if (discharge >= new Date('December 1, ' + year).toISOString() && discharge <= new Date('December 31, ' + year).toISOString()) {
                        total.Dec += response.data[i].volume;
                        total.Q4 += response.data[i].volume;
                        total.total += response.data[i].volume;
                    }
                }
                
                var remainTotal = total.cap - prevYearSum;
                total.perLeft = ((remainTotal / total.cap) * 100).toFixed() + '%';
                formatTotal(total);
                total.spreadsiteName = response.data[0].spreadsiteName;
                $scope.spreadTotals.push(total);
            }, function(error){
                console.log(error);
            });
    };

    $scope.genPDF = function(reportName, records){
        //http://mrrio.github.io/jsPDF/doc/symbols/jsPDF.html
        var doc = new jsPDF('p','pt', 'letter');

        /*
        Max Width is 612
         */
        var curY = 0;

        var repName = reportName;
        if (reportName === "collectionsReport"){
            repName = "Collections Report";
        } else if (reportName === "spreadCollections"){
            repName = "Spread Site Totals"
        }

        curY=curY+15;
        doc.text(repName,curY,20);
        doc.setLineWidth(1);
        curY=curY+15;
        doc.line(30,curY,580,curY);

        records.forEach(function(record,index,records){
            if(reportName ==="collectionsReport"){
                curY = formatCollectionRec(doc,record, curY);
            } else if (reportName === "spreadCollections"){
                curY = formatSpreadSiteRec(doc,record,curY);
            }
            if(curY > 700){
                doc.addPage();
                curY=20;
            } else {
                doc.setLineWidth(1);
                doc.line(30,curY,580,curY);
            }
        });

        doc.output("dataurlnewwindow");
    };

    function formatCollectionRec(doc, record, curY){
        curY=curY+20;
        doc.text("Company: "+record.companyName,20,curY);
        curY=curY+20;
        doc.text("Truck VIN: "+record.truckId,20,curY);
        doc.text("Volume: "+record.volume,350,curY);
        curY=curY+20;
        doc.text("Collection Coordinates: Lat="+record.location.latitude+" Lon="+record.location.longitude,20,curY);
        curY=curY+20;
        doc.text("Address: "+record.location.address,20,curY);
        curY=curY+20;
        doc.text("Type: "+record.type,20,curY);
        doc.text("Date/Time: "+ new Date(record.createdTimeStamp).toDateString() + " " + new Date(record.createdTimeStamp).toLocaleTimeString(),200,curY);
        curY=curY+20;
        return curY;
    }

    function formatSpreadSiteRec(doc, record, curY){
        curY=curY+20;
        doc.text("Spread Site: "+record.spreadsiteName,20,curY);
        curY=curY+40;
        doc.text("Total: "+record.total,20,curY);
        doc.text("Jan: "+record.Jan,200,curY);
        doc.text("May: "+record.May,320,curY);
        doc.text("Sep: "+record.Sep,460,curY);
        curY=curY+20;
        doc.text("Capacity: "+record.cap,20,curY);
        doc.text("Feb: "+record.Feb,200,curY);
        doc.text("Jun: "+record.Jun,320,curY);
        doc.text("Oct: "+record.Oct,460,curY);
        curY=curY+20;
        doc.text("Percent Left: "+record.perLeft,20,curY);
        doc.text("Mar: "+record.Mar,200,curY);
        doc.text("Jul: "+record.Jul,320,curY);
        doc.text("Nov: "+record.Nov,460,curY);
        curY=curY+20;
        doc.text("Apr: "+record.Apr,200,curY);
        doc.text("Aug: "+record.Aug,320,curY);
        doc.text("Dec: "+record.Dec,460,curY);
        curY=curY+20;
        doc.text("Q1: "+record.Q1,20,curY);
        curY=curY+20;
        doc.text("Q2: "+record.Q2,20,curY);
        curY=curY+20;
        doc.text("Q3: "+record.Q3,20,curY);
        curY=curY+20;
        doc.text("Q4: "+record.Q4,20,curY);
        curY=curY+20;
        /*if(record.dischargeLocation !== null){
            doc.text("Discharge Coordinates: Lat="+record.dischargeLocation.latitude+" Lon="+record.dischargeLocation.longitude,20,curY);
            curY=curY+20;
        }
        doc.text("Type: "+record.type,20,curY);
        doc.text("Date/Time: "+record.dischargeTimeStamp,200,curY);
        curY=curY+20;*/
        return curY;
    }


    $scope.clearCompanyFields = function(){
        $scope.company = {};
        $scope.company.name = "";
        $scope.company.phone = "";
        $scope.company.active = "";
        $scope.company_form.$setPristine();
    };

    function clearTruckFields(){
        $scope.newTruck = {};
        $scope.selectedCompany = "";
        $scope.newTruck.vin = "";
        $scope.newTruck.capacity = "";
        $scope.newTruck.tag = "";
        $scope.newTruck.nickname = "";
        $scope.newTruck.make = "";
        $scope.newTruck.model = "";
        $scope.newTruck.year = "";
        $scope.newTruck.stat = "";
        $scope.approvedDrivers.usernames = {};
        $scope.truck_form.$setPristine();
    }

    function clearFields(){
        $scope.newUser = {};
        $scope.newUser.username = "";
        $scope.newUser.password = "";
        $scope.newUser.email = "";
        $scope.newUser.type = "";
        $scope.selectedCompany = "";
        $scope.selectedUser = "";
        document.getElementById('username').disabled = false;
        document.getElementById('company').disabled = false;
        $scope.user_form.$setPristine();
    }

    function clearSpreadSiteFields(){
        $scope.spreadSiteForm = {};
        $scope.spreadSiteForm.name = "";
        $scope.spreadSiteForm.address = "";
        $scope.spreadSiteForm.contactName = "";
        $scope.spreadSiteForm.phone = "";
        $scope.spreadSiteForm.nitro = "";
        $scope.spreadSiteForm.acres = "";
        $scope.spreadsite_form.$setPristine();
    }
    
    function addFlash(message){
        flash(message);
        if (document.getElementById('flash-remove')) {
            document.getElementById('flash-remove').id = 'flash-messages'; 
        }
        setTimeout(function (){
            flash('');
            var flashEl = document.getElementById('flash-messages');
            flashEl.id = 'flash-remove';
        },3000);
    }
    
    function numFormat(num1){
        var newNum = num1.toString();
        newNum = newNum.split('');
        newNum = newNum.reverse();
        var newNum2 = [];
  
        newNum.forEach(function(element){
            newNum2.push(element);
        });
  
        var inc = 1;
        for(var i=0;i<newNum.length;i++){

            if( (i+1) % 3 === 0 && newNum[i+1]){
            newNum2.splice(i+inc, 0, ',');
            inc++;
            }
    
        }
        newNum2 = newNum2.reverse();
        newNum2 = newNum2.join('');
        return newNum2;

    }
    
    function formatTotal(total){
        total.total = numFormat(total.total);
        total.cap = numFormat(total.cap);
        total.Q1 = numFormat(total.Q1);
        total.Q2 = numFormat(total.Q2);
        total.Q3 = numFormat(total.Q3);
        total.Q4 = numFormat(total.Q4);
        total.Jan = numFormat(total.Jan);
        total.Feb = numFormat(total.Feb);
        total.Mar = numFormat(total.Mar);
        total.Apr = numFormat(total.Apr);
        total.May = numFormat(total.May);
        total.Jun = numFormat(total.Jun);
        total.Jul = numFormat(total.Jul);
        total.Aug = numFormat(total.Aug);
        total.Sep = numFormat(total.Sep);
        total.Oct = numFormat(total.Oct);
        total.Nov = numFormat(total.Nov);
        total.Dec = numFormat(total.Dec);
    }

    //Luke added button control here
    $scope.setButton = function(value){
        $scope.button = value;
    };

    $scope.isButton = function(value){
        return $scope.button === value;
    };
    
    $scope.sendLogout = function(){
        logoutService.logout()
            .then(function(data){
                //console.log("login good");
                //a test
                $location.url("/");
            }, function(error){
                //console.log("login bad");
            }
        );
    }
}]);