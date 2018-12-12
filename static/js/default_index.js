
// This is the js for the default/index.html view.
var app = function() {
  var self = {};

  Vue.config.silent = false; // show all warnings

  self.go_to_backlog_graph = function() {
    console.log("Go to backlog graphaa ");
  };
  self.go_to_work_done_graph = function() {
    console.log("Go to work done graph ");
  };

  self.go_to_progress_graph = function() {
    console.log("Go to progress graph ");
  };

  self.go_to_account_settings = function() {
    console.log("Go to account graph ");
  };

  self.set_user_story_details = function() {

    // sets the project details
    self.vue.num_of_sprints = document.getElementById("numberOfSprints").value;
    self.vue.length_of_sprint = document.getElementById("lengthOfSprint").value;
    self.vue.sprint_start_date = document.getElementById("sprintStartDate").value;

    var user_email = localStorage.getItem("user_email");


    $.post(
      set_project_details,
      {
        num_of_sprints: self.vue.num_of_sprints,
        length_of_sprint: self.vue.length_of_sprint,
        sprint_start_date: self.vue.sprint_start_date,
        user_email: user_email
      },
      function(data) {
        console.log("This is the team name " + data)
      }
    );

    // Make a list of all story points
    var num_of_sprints = document.getElementById("numberOfSprints").value;
    var logged_in_user_email = localStorage.getItem("user_email");
    var i;
    console.log("Logged in user email ", logged_in_user_email);
    for (i = 1; i <= num_of_sprints; i++) {
      var num_of_user_stories = document.getElementById(
        "num_of_stories_input_" + i
      ).value;
      console.log("num of user stories is ", num_of_user_stories);
      for (j = 1; j <= num_of_user_stories; j++) {
        var story_pts = document.getElementById("sn" + i + "sp" + j).innerHTML;
        $.post(
          set_user_story_points,
          {
            highest_story_num: num_of_user_stories,
            highest_sprint_num: num_of_sprints,
            sprint_num: i,
            story_num: j,
            story_points: story_pts,
            story_email: logged_in_user_email
          },
          function(data) {
            console.log("Rows is ", data);
            if (data == "True") {
              window.alert("Information submitted!");
              document.getElementById("backlogDirect").click();
            }
          }
        );
      }
    }
  };

  self.get_backlog_story_points = function() {
    var user_email = localStorage.getItem("user_email");
    if(user_email == "") {
      var img = document.createElement("img");
      img.src =  "../static/images/logInError.png";
      var src = document.getElementById("fillerBacklog");
      src.appendChild(img);
    }else{
      $.post(
        get_project_details,
        {
          user_email: user_email
        },
        function(data) {
          //   Check if dashboard page has been filled out
          console.log("able to get here: ", data);
          // Check if the user has submitted their project details in dashboard
          if (data == "None") {
            var img = document.createElement("img");
            img.src = "../static/images/backlog.png";
            var src = document.getElementById("fillerBacklog");
            src.appendChild(img);
          } else {
            var showSlide = document.getElementById("slideOnBackLog")
            showSlide.style.display = "block"
            num_of_sprints = data;
            console.log("number of sprints is " + num_of_sprints)
            $.getJSON(
              total_story_points_for_sprint,
              {
                num_of_sprints: num_of_sprints,
                user_email: user_email
              },
              function(data) {
                console.log("did we get the data?")
                self.vue.story_points = data.total_story_points_list;
                // If somehow the user is logged in and didn't input details into the dashboard
                // Tell them to do so..
                if (self.vue.story_points[0] == 0) {
                  var img = document.createElement("img");
                  img.src = "../static/images/backlog.png";
                  var src = document.getElementById("fillerBacklog");
                  src.appendChild(img);
                } else {
                  console.log(
                    "this will probably be none: ",
                    self.vue.story_points
                  );
                  self.draw_backlog_chart();
                  self.draw_sprint_chart(num_of_sprints);
                }
              }
            );
          }
        }
      );
    }

  };

  self.draw_sprint_chart = function(number_of_sprints) {
    var i;
    var chart_counter = 0;
    for (i = 0; i < number_of_sprints; i++) {
      // First, create an array for the nth sprint.
      // The array will contain values , from user story 1, until user story n
      // where each index of the array will be the story number.
      $.getJSON(
        get_all_story_points_of_a_sprint,
        {
          //  We first need to figure out how many user stories there are in a given sprint
          sprint_num: i + 1,
          user_email: localStorage.getItem("user_email")
        },
        function(data) {
          // Initialize array to store our story points in
          var array = [];
          // First index of array must specifiy the data
          array[0] = ["User Story Number ", "Story Point"];
          // Access the stored values in our vue story points array
          var j;
          console.log("data answer is : ", data.answer);
          var colorArray = []
          for (j = 1; j <= data.answer.length; j++) {
            colorArray[j-1] = Math.floor(Math.random()*16777215).toString(16);
            var storyNum = j;
            // Story point should be an int
            var storyPoint = parseInt(data.answer[j - 1]);
            // Update our array to have the right sprint num and story point
            array[j] = [storyNum, storyPoint];
            if (j == data.answer.length) {
              google.charts.load("current", { packages: ["corechart"] });
              google.charts.setOnLoadCallback(
                self.drawSprintChart(data.sprint, array, chart_counter,colorArray)
              );
            }
            chart_counter++;
          }
        }
      );
    }
  };

  // // Draw the chart and set the chart values
  self.drawSprintChart = function(sprintNum, array, chart_counter,clr) {
    // Load google charts
    google.charts.load("current", { packages: ["corechart"] });

    // Load google charts
    google.charts.setOnLoadCallback(doThis);

    function doThis() {
      var data = google.visualization.arrayToDataTable(array);
      //     //Optional add a title and set the width and height of the chart
      var options = {
        title: "Sprint " + sprintNum + " Goals",
        width: 1150,
        height: 700,
        vAxis: { title: "Story Points", format: "0" },
        hAxis: { title: "User Story Number", format: "0" },
        colors: ['#808080']
      };
      // Display the chart inside the <div> element with id="columnChart"
      var div = document.createElement("div");
      div.setAttribute("id", "sprint_graph_" + (chart_counter + 1));
      // Create the class item 
      var itemDiv = document.createElement("div");
      itemDiv.classList.add("item")
      // Add the current spring graph div into the main class item div 
      itemDiv.appendChild(div)
      var original_div = document.getElementById("carouselInner");
      original_div.appendChild(itemDiv);
      var chart = new google.visualization.ColumnChart(
        document.getElementById("sprint_graph_" + (chart_counter + 1))
      );
      chart.draw(data, options);
    }
  };

  self.get_work_done_data = function() {
    console.log("in here")
    if(localStorage.getItem("user_email") == "" ){

    }else{
      $.getJSON(get_work_done_data, {}, function(data) {
        self.vue.story_points = data.story_points_list;
        self.draw_backlog_chart();
      });
    }

  };

  self.draw_backlog_chart = function() {
    // Load google charts
    google.charts.load("current", { packages: ["corechart"] });

    // Initialize array to store our story points in
    var array = [];

    // First index of array must specifiy the data
    array[0] = ["Sprint", "Story Point"];

    var i;

    var sumOfStoryPoints = 0;
    var colorArray = []

    // Access the stored values in our vue story points array
    for (i = 1; i <= self.vue.story_points.length; i++) {
      var sprintNum = i;
      // Story point should be an int
      var storyPoint = parseInt(self.vue.story_points[i - 1]);
      sumOfStoryPoints = sumOfStoryPoints + storyPoint;
      // Update our array to have the right sprint num and story point
      array[i] = [sprintNum, storyPoint];
      // Create an array of random colors for our graph
    }



    document.getElementById("backlogStoryPoints").innerHTML =
         " Story Points Distribution " 


    // Load google charts
    google.charts.setOnLoadCallback(drawChart);

    // Draw the chart and set the chart values
    function drawChart() {
      console.log("color array is " + colorArray)
      var data = google.visualization.arrayToDataTable(array);

      //   Optional add a title and set the width and height of the chart
      var options = {
        title: "Total Work To be Completed",
        width: 1150,
        height: 700,
        vAxis: { title: "Story Points", format: "0" },
        hAxis: { title: "Sprint Number", format: "0" },
        colors:  ['#808080']
      };

      // Test Code

      var div = document.createElement("div");
      div.setAttribute("id", "total_sprint_graph");
      var original_div = document.getElementById("itemActive");
      original_div.appendChild(div);
      // Display the chart inside the <div> element with id="columnChart"
      var chart = new google.visualization.ColumnChart(
        document.getElementById("total_sprint_graph")
      );
      chart.draw(data, options);
    }
  };

  self.create_table_for_work_done = function() {
    console.log("here")
    if(localStorage.getItem('user_email') == ""){
      var img = document.createElement("img");
      img.src =  "../static/images/logInError.png";
      var src = document.getElementById("fillerWorkDone");
      src.appendChild(img);
    }else{
      // See if there is data that exists, if there is create an array to store the data and pass it into the if-else. If there isn't then there's nothing to pass. 
      var existing_data = [];
      $.getJSON( get_work_done_data,
        {
          user_email : localStorage.getItem('user_email')
        },
        function(data){
          console.log("look for answer here")
          console.log(data.answer)
          for(i = 0 ; i < data.answer.length; i++){
            console.log()
            existing_data[i] = [data.answer[i][0], data.answer[i][1]]
          }
        });

      $.post(
        get_project_details,
        {
          user_email: localStorage.getItem("user_email")
        },
        function(data) {
          document.getElementById("WorkDoneToggle").style.display = "block"
          // Create a chart so use can update their progress
          self.vue.num_of_sprints = data;

          $.getJSON(
            total_story_points_for_sprint,
            {
              user_email: localStorage.getItem("user_email"),
              num_of_sprints: self.vue.num_of_sprints
            },
            function(data) {
              self.vue.total_story_points_list = data;
              if (data.total_story_points_list[0] == 0) {
                var img = document.createElement("img");
                img.src = "../static/images/backlog.png";
                var src = document.getElementById("fillerWorkDone");
                var submitButton = (document.getElementById(
                  "wd_table"
                ).style.display = "none");
                src.appendChild(img);
  
              } else {
                var myTableDiv = document.getElementById("work_done_table");
                if (myTableDiv.hasChildNodes()) {
                  myTableDiv.removeChild(myTableDiv.childNodes[0]);
                }
                var table = document.createElement("TABLE");
                table.border = "1";
                var tableBody = document.createElement("TBODY");
                table.appendChild(tableBody);
                for (var i = 0; i < self.vue.num_of_sprints; i++) {
                  var tr = document.createElement("TR");
                  if (i == 0) {
                    var thSprintNumber = document.createElement("TH");
                    var thPointsCompleted = document.createElement("TH");
                    var thTotalStoryPoints = document.createElement("TH");
                    thSprintNumber.appendChild(
                      document.createTextNode("Sprint Number")
                    );
                    thPointsCompleted.appendChild(
                      document.createTextNode("Story Points Completed")
                    );
                    thTotalStoryPoints.appendChild(
                      document.createTextNode("Max Possible Points for Sprint")
                    );
                    tableBody.append(thSprintNumber);
                    tableBody.append(thPointsCompleted);
                    tableBody.append(thTotalStoryPoints);
                  }
                  tableBody.appendChild(tr);
                  for (var j = 0; j < 3; j++) {
                    var td = document.createElement("TD");
                    td.width = "100";
                    if (j == 0) {
                      td.appendChild(
                        document.createTextNode(" " + (i + 1) + " ")
                      );
                    } else if (j == 1) {
                      td.contentEditable = "true";
                      console.log( existing_data)
                      if(existing_data[i] != undefined) {
                        td.textContent = existing_data[i][1]
                      }
                      td.setAttribute("id", "wd" + (i + 1));
                    } else {
                      td.appendChild(
                        document.createTextNode(
                          self.vue.total_story_points_list
                            .total_story_points_list[i]
                        )
                      );
                    }
                    tr.appendChild(td);
                  }
                }
                myTableDiv.appendChild(table);
              }
            }
          );
        }
      );
    }

  };

  self.update_wd_table = function() {
    var htmlstring = document.getElementById("wd1").innerHTML;
    htmlstring = htmlstring.trim
      ? htmlstring.trim()
      : htmlstring.replace(/^\s+/, "");
    if (document.getElementById("wd1").innerHTML == "") {
      console.log("we are here");
      window.alert(
        "Please fill out all the points completed, if none, put in 0 "
      );
    } else {
      var i;
      email = localStorage.getItem("user_email");
      // Gather data from table and send it to database
      for (i = 1; i <= self.vue.num_of_sprints; i++) {
        $.post(
          set_work_done_data,
          {
            highest_sprint: self.vue.num_of_sprints,
            sprint_num: i,
            story_points: parseInt(document.getElementById("wd" + i).innerHTML),
            email: email
          },
          function(data) {
            if(data == self.vue.num_of_sprints) {
              window.alert("Completed Points submitted!");
              document.getElementById("progressDirect").click();
            }
          }
        );
      }
    }
  };

  self.add_user_story_for_sprints = function() {
    // Get Number of Sprints
    var num_of_sprints = document.getElementById("numberOfSprints").value;

    // Get the div element where user will fill in user stories and points
    var user_story_chart = document.getElementById(
      "user_story_details_after_sprint"
    );

    // If user wants to add different number of sprints, just re-start the div with that number of sprints
    while (user_story_chart.firstChild) {
      user_story_chart.removeChild(user_story_chart.firstChild);
    }

    // Create a div_sprint_and_story_i
    for (i = 0; i < num_of_sprints; i++) {
      // Create a <h> tag for each sprint and name it 'sprint_header_num(i)'
      var header_num = document.createElement("h2");
      header_num.setAttribute("id", "sprint_header_num" + (i + 1));
      var print_newline = document.createElement("br");
      // Fill the content of that header with "Sprint i"
      var sprint_label = document.createTextNode("Sprint " + (i + 1));
      // Attach content to header
      header_num.appendChild(sprint_label);
      // Create a div for each sprint and user story combo
      var sprint_divs = document.createElement("div");
      sprint_divs.setAttribute("id", "sprint_and_story_" + (i + 1));
      sprint_divs.className = "grid-x grid-container full"

      // Attach the header for the sprint to the div
      header_num.className = "cell work_done_class"
      sprint_divs.appendChild(header_num);
      // Add a button for this header to add story points
      var ask_for_num_of_stories_div = document.createElement("div");
      ask_for_num_of_stories_div.className = "grid-x grid-container full"
      ask_for_num_of_stories_div.setAttribute(
        "id",
        "ask_for_num_of_stories_div_" + (i + 1)
      );
      var num_of_stories_input = document.createElement("input");
      num_of_stories_input.className = "cell medium-5"
      num_of_stories_input.type = "number";
      num_of_stories_input.setAttribute(
        "id",
        "num_of_stories_input_" + (i + 1)
      );
      var header_button = document.createElement("BUTTON");
      var button_content = document.createTextNode(
        "# of user stories"
      );
      header_button.setAttribute("id", i + 1);
      header_button.setAttribute("class", 'small button secondary cell medium-5');

      space_div1 = document.createElement("div")
      space_div2 = document.createElement("div")
      space_div2.className = "cell medium-2"
      space_div3 = document.createElement("div")


      header_button.onclick = function() {
        self.load_user_story_chart(this.id);
      };

      header_button.appendChild(button_content);
      ask_for_num_of_stories_div.appendChild(space_div1);
      ask_for_num_of_stories_div.appendChild(num_of_stories_input);
      ask_for_num_of_stories_div.appendChild(space_div2);
      ask_for_num_of_stories_div.appendChild(header_button);
      sprint_divs.appendChild(ask_for_num_of_stories_div);
      ask_for_num_of_stories_div.appendChild(space_div3);
      // Attach the div to the main div that displays all sprints
      user_story_chart.appendChild(sprint_divs);
      user_story_chart.appendChild(print_newline);
    }
  };

  self.load_user_story_chart = function(sprintNum) {
    var num_of_stories = document.getElementById(
      "num_of_stories_input_" + sprintNum
    ).value;
    //Code changed from : https://stackoverflow.com/questions/14643617/create-table-using-javascript
    var id_of_sprint = "ask_for_num_of_stories_div_" + sprintNum;

    var myTableDiv = document.getElementById(id_of_sprint);

    if (myTableDiv.childNodes.length == 3) {
      myTableDiv.childNodes[2].remove();
    }

    var table = document.createElement("TABLE");
    table.border = "1";
    var tableBody = document.createElement("TBODY");
    table.appendChild(tableBody);
    for (var i = 0; i < num_of_stories; i++) {
      var tr = document.createElement("TR");
      if (i == 0) {
        var thUserStoryNumber = document.createElement("TH");
        var thUserStoryPoints = document.createElement("TH");
        thUserStoryNumber.appendChild(document.createTextNode("User Story"));
        thUserStoryPoints.appendChild(document.createTextNode("Story Points"));
        tableBody.append(thUserStoryNumber);
        tableBody.append(thUserStoryPoints);
      }
      tableBody.appendChild(tr);
      for (var j = 0; j < 2; j++) {
        var td = document.createElement("TD");

        td.width = "100";
        if (j == 0) {
          td.appendChild(document.createTextNode(" " + (i + 1) + " "));
        } else {
          td.setAttribute("id", "sn" + parseInt(sprintNum) + "sp" + (i + 1));
          td.contentEditable = "true";
        }
        tr.appendChild(td);
      }
    }
    myTableDiv.appendChild(table);
  };

  self.load_chart_for_work_done = function(work_done_array) {
    if(localStorage.getItem("user_email") == ""){
      var img = document.createElement("img");
      img.src =  "../static/images/logInError.png";
      var src = document.getElementById("fillerWorkDone");
      src.appendChild(img);
    }else{
      $.post(
        get_project_details,
        {
          user_email: localStorage.getItem("user_email")
        },
        function(data) {
          document.getElementById("WorkDoneToggle").style.display="block"
          //   Check if dashboard page has been filled out
          console.log("able to get here: ", data);
          // Check if the user has submitted their project details in dashboard
          if (data == "None") {
            var img = document.createElement("img");
            img.src = "../static/images/backlog.png";
            var src = document.getElementById("fillerWorkDone");
            var submitButton = (document.getElementById(
              "wd_table"
            ).style.display = "none");
            src.appendChild(img);
  
  
          } else {
            document.getElementById("self_contribution_work_done").style.display= "block";
            self.create_table_for_work_done();
            // Load google charts
            google.charts.load("current", { packages: ["corechart"] });
            google.charts.setOnLoadCallback(drawChart);
  
            // Draw the chart and set the chart values
            function drawChart() {
              if (
                typeof work_done_array !== "undefined" &&
                work_done_array.length > 0
              ) {
                var data = google.visualization.arrayToDataTable(work_done_array);
              } else {
                var data = google.visualization.arrayToDataTable([
                  ["Sprint", "Story Point"],
                  ["1", 10],
                  ["2", 0],
                  ["3", 0],
                  ["4", 0],
                  ["5", 0]
                ]);
              }
              // Optional; add a title and set the width and height of the chart
              var options = {
                title: " Amount of Work Currently Completed ",
                width: 550,
                height: 400,
                vAxis: { title: "Story Points" },
                hAxis: { title: "Sprint Number" }
              };
  
              // Display the chart inside the <div> element with id="columnChart"
              // var chart = new google.visualization.LineChart(document.getElementById('work_done_chart'));
              // chart.draw(data, options);
            }
  
            // self.select_contribution_name();
          }
        }
      );

      $.post(get_user_work_done,
        {
          user_email : localStorage.getItem('user_email')
        },function(data){
          console.log("contribution pts is " + data)
          var contribution_div = document.getElementById("piechart_info")
          contribution_div.value = data
      })

    }

  };

  self.get_work_done_data = function() {

    $.post(get_work_done_data, {}, function(data) {
      self.vue.work_done_list = data.answer;
      // Create array of the data
      var work_done_list = [];
      work_done_list[0] = ["Sprint", "Work Completed"];
      for (i = 1; i <= self.vue.work_done_list.length; i++) {
        var sprintNum = self.vue.work_done_list[i - 1][0];
        // Story point should be an int
        var storyPoint_completed = parseInt(self.vue.work_done_list[i - 1][1]);
        // Update our array to have the right sprint num and story point
        work_done_list[i] = [sprintNum, storyPoint_completed];
        if (i == self.vue.work_done_list.length) {
          self.load_chart_for_work_done(work_done_list);
        }
      }
    });  

  };

  self.get_progress_data = function() {
    var total_work_list = [];
    var total_completed_list = [];
    var ideal_list = [];
    var progress_list = [];

    var loopVar = 0;
    if(localStorage.getItem('user_email') == ""){
      var img = document.createElement("img");
      img.src = "../static/images/logInError.png";
      var src = document.getElementById("progressToggle");
      src.classList.add("text-center")
      src.appendChild(img);
    }else{
    // Calculate amount of work that has been finished so far
    $.post(
      get_work_done_data,
      {
        user_email: localStorage.getItem("user_email")
      },
      function(data) {
        document.getElementById("toggleOnProgress").style.display = "block"
        var temp_work_done_list = data.answer;
        if (data.answer == "") {
          var img = document.createElement("img");
          img.src = "../static/images/backlog.png";
          var src = document.getElementById("fillerProgress");
          src.appendChild(img);
        } else {
          loopVar = temp_work_done_list.length;
          var runningSum = 0;
          for (i = 1; i <= loopVar; i++) {
            var sprintNum = temp_work_done_list[i - 1][0];
            // Story point should be an int
            var storyPoint_completed = parseInt(temp_work_done_list[i - 1][1]);
            runningSum += storyPoint_completed;
            if(storyPoint_completed == 0) {
              runningSum = null
            }
            // Update our array to have the right sprint num and story point
            total_completed_list[i - 1] = runningSum;
          }
          console.log("total compelted list ")
          console.log(total_completed_list)

          // Calculate total amount of work that has to be finished
          $.getJSON(
            get_story_points,
            {
              user_email: localStorage.getItem("user_email")
            },
            function(data) {
              self.vue.story_points = data.answer;

              ideal_list = new Array(data.ideal.length)
              ideal_list.fill(0)
              for(z = 0 ; z < data.ideal.length; z++){
                if( z == 0){
                  ideal_list[z] = data.ideal[z]
                }
                else{
                  ideal_list[z] = ideal_list[z-1] + data.ideal[z]
                }
              }
              console.log(ideal_list)
              var points_array = self.vue.story_points;
              var total_story_points = 0;

              // Loop through array of points and sum it
              for (i = 0; i < self.vue.story_points.length; i++) {
                // Update our array to have the right sprint num and story point
                total_story_points = total_story_points + parseInt(points_array[i][1]);
              }

              // Calculate total ideal progress
              $.getJSON(
                get_project_details,
                {
                  user_email: localStorage.getItem("user_email")
                },
                function(data) {
                  $.getJSON(
                    get_project_date_details,
                    {
                      user_email: localStorage.getItem("user_email")
                    },
                    function(data) {
                      var date_intervals = [];
                      // Get the correct dates
                      var startdate = new Date(data.start_date);
                      temp = new Date(
                        startdate.setDate(startdate.getDate() + 1)
                      );
                      date_intervals[0] = temp;
                      var dateCounter;
                      sprint_days = parseInt(data.length_of_sprint);
                      for (
                        dateCounter = 1;
                        dateCounter <= loopVar;
                        dateCounter++
                      ) {
                        var temp_date = new Date(
                          date_intervals[dateCounter - 1]
                        );
                        temp = new Date(
                          temp_date.setDate(temp_date.getDate() + sprint_days)
                        );
                        date_intervals[dateCounter] = temp;
                      }

                      //Combine all data above together and draw a chart with it
                      progress_list[0] = [
                        "Sprint",
                        "Total Work",
                        "Work Completed",
                        "Ideal Progress"
                      ];
                      progress_list[1] = [
                        "" +
                          (date_intervals[0].getMonth() + 1) +
                          " / " +
                          date_intervals[0].getDate() +
                          "",
                        total_story_points,
                        0,
                        0
                      ];
                      for (i = 2; i <= loopVar + 1; i++) {
                        progress_list[i] = [
                          "" +
                            (date_intervals[i - 1].getMonth() + 1) +
                            " / " +
                            date_intervals[i - 1].getDate() +
                            "",
                          total_story_points,
                          total_completed_list[i - 2],
                          ideal_list[i - 2]
                        ];
                      }

                      self.load_chart_for_progress(progress_list);
                      self.label_for_progress(
                        loopVar,
                        total_completed_list,
                        ideal_list
                      );
                    }
                  );
                }
              );
            }
          );
        }
      }
    );
    }
  };

  self.label_for_progress = function(num_sprint, completed, ideal) {
    var div = document.getElementById("project_status");
    var count;
    for (count = 0; count < num_sprint; count++) {
      var header = document.createElement("h2");
      if (completed[count] < ideal[count]) {
        header.appendChild(document.createTextNode("Sprint " + (count + 1) ))
        header.style.color = "red"
      } else if (completed[count] == ideal[count]) {
        header.appendChild(document.createTextNode("Sprint " + (count + 1) ))
        header.style.color = 	"#FF8C00"
      } else {
        header.appendChild(document.createTextNode("Sprint " + (count + 1) ))
        header.style.color = "green"
      }
      div.appendChild(header);
    }
  };

  self.load_chart_for_progress = function(progress_array) {
    // Load google charts
    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(drawChart);

    // Draw the chart and set the chart values
    function drawChart() {
      if (typeof progress_array !== "undefined" && progress_array.length > 0) {
        var data = google.visualization.arrayToDataTable(progress_array);
      } else {
        var data = google.visualization.arrayToDataTable([
          ["Sprint", "Story Point"],
          ["1", 10],
          ["2", 0],
          ["3", 0],
          ["4", 0],
          ["5", 0]
        ]);
      }
      // Optional; add a title and set the width and height of the chart
      var options = {
        title: " Overall Progress  ",
        interpolateNulls: false,
        width: 800,
        height: 400,
        vAxis: { title: "Story Points" },
        hAxis: { title: "Sprint Date Intervals" }
      };

      // Display the chart inside the <div> element with id="columnChart"
      var chart = new google.visualization.LineChart(
        document.getElementById("progressChart")
      );
      chart.draw(data, options);
    }
  };

  self.register_user = function() {
    var first_name = document.getElementById("register_firstname").value;
    var last_name = document.getElementById("register_lastname").value;
    var email = document.getElementById("register_email").value;
    var password = document.getElementById("register_password").value;
    var team_name = document.getElementById("register_team_name").value;
    var class_name = document.getElementById("register_class_name").value;

    $.post(
      set_user_info,
      {
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: password,
        team_name: team_name,
        class_name: class_name
      },
      function(data) {
        window.alert("Registration Complete!");
      }
    );
  };

  // Check if user account exists in the database
  self.log_in = function() {
    console.log("in login function")
    $.getJSON(
      check_log_in,
      {
        login_email: document.getElementById("login_email").value,
        login_password: document.getElementById("login_password").value
      },
      function(data) {
        if (data.user_info_list[0] == null) {
          window.alert("Account Not Recognized, Please Try Again!");
        } else {
          // Get user email and set it into localstorage so this can be accessed
          //on other pages
          localStorage.setItem("user_email", data.user_info_list[2]);
          console.log("trying this ");
          window.alert("Succesfully Logged in!");
          document.getElementById("clickme").click();
        }
      }
    );
  };

  self.log_out = function() {
    console.log("here now ");
 
    localStorage.setItem('user_email', '')
    window.alert("Logged Out!")
  }

  self.populate_user_info = function() {
    // Access the email passed from the login page
    var logged_in_user_email = localStorage.getItem("user_email");
    $("#populate_pending_invites").click();
    $.getJSON(
      get_user_info,
      {
        login_email: logged_in_user_email
      },
      function(data) {
        self.fill_account_settings_member_list();
        if (data.user_info_list[0] == null) {
        } else {
          // document.getElementById("first_name").innerHTML =
            // data.user_info_list[0];
          // document.getElementById("last_name").innerHTML =
            // data.user_info_list[1];
          // document.getElementById("user_email").innerHTML =
            // data.user_info_list[2];
            var currentClass =  document.getElementById("current_class")
            currentClass.innerHTML = data.user_info_list[3];
            currentClass.style.fontSize = "xx-large";
            currentClass.style.fontFamily =  "Helvetica"

            var currentName =   document.getElementById("user_team_name")
            currentName.innerHTML =  data.user_info_list[4];
            currentName.style.fontSize = "xx-large"
            currentName.style.fontFamily =  "Helvetica"
        }
      }
    );
  };

  self.send_email_invite = function(function_clicked) {
    console.log("in send e-mail invite")
    var form = document.getElementById("emaiL_form_account_settings");
    var button = document.getElementById("btn_emaiL_form_account_settings")
    if (form.style.display === "none") {
      form.style.display = "block";
      button.style.display = "block";
    } else {
      form.style.display = "none";
      button.style.display = "none";
    }
  }

  self.invite_button = function() {
    var email = $('#invite_email').val();
    // Grabs email from email input box and sets it into the database
    
    $.post(
      set_email_to_invite_list,
      {
        invite_email : email,
        team_owner : localStorage.getItem('user_email'),
        response: 'Not Responded'
      },
      function(data) {
        console.log(" inviting:  " + data)
        location.reload();
      })
  }

  self.populate_invite_list = function(){
    console.log("in populate invite list")
    var x = document.getElementById("inviteList");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }

    // Get invite list for this user 
    $.getJSON(
      get_invite_list,
      {
        invites_for_this_user: localStorage.getItem('user_email')
      },
      function(data) {
        var invites = data.amt
        console.log(invites.length)
        if(invites.length == 0) window.alert("No Invites Yet!")
        // console.log(" invitation from  " +     invites[0].team_owner_name  + "  to join  " + invites[0].team_name )

        // Populate the invite field 
        var invite_list = document.getElementById("inviteList")
        while (invite_list.firstChild) {
          invite_list.removeChild(invite_list.firstChild);
        }
        var table = document.createElement("TABLE");
        table.border = "1";
        var tableBody = document.createElement("TBODY");
        table.appendChild(tableBody);
        for (var i = 0; i < invites.length; i++) {
          var tr = document.createElement("TR");
          if (i == 0) {
            // Create 3 table headers: Invitation from email, from name, and team name.
            var thFromEmail = document.createElement("TH");
            var thFromName = document.createElement("TH")
            var thTeam = document.createElement("TH");
            var thResponse = document.createElement("TH")
            // 
            thFromEmail.appendChild(document.createTextNode(" Invitation From "));
            thFromName.appendChild(document.createTextNode(" Team Owner "))
            thTeam.appendChild(document.createTextNode("  To Join "));
            thResponse.appendChild(document.createTextNode("Your Response"))
            tableBody.append(thFromEmail);
            tableBody.append(thFromName);
            tableBody.append(thTeam);
            tableBody.append(thResponse);
          }
          tableBody.appendChild(tr);
          for (var j = 0; j < 4; j++) {
            var td = document.createElement("TD");
            td.width = "100";
            if (j == 0) {
              td.appendChild(document.createTextNode("" + invites[i].team_owner_email));
              td.setAttribute('id','invite_from_email_'+(i+1))
            } else if (j == 1) {
              td.appendChild(document.createTextNode(""+ invites[i].team_owner_name));
            }else if (j == 2){
              td.appendChild(document.createTextNode(""+ invites[i].team_name));
            }else{
              td.appendChild(document.createTextNode("  "));
              var acceptButton = document.createElement("button")
              var declineButton = document.createElement("button")
              acceptButton.innerHTML = "Accept"
              acceptButton.setAttribute("id", "accept_btn_" + (i+1));
              // console.log(invites[i].team_owner_email)
              acceptButton.onclick = function() {
                self.invite_btn_click('Accepted', this.id);
              };
              declineButton.innerHTML = "Decline"
              declineButton.setAttribute("id", "decline_btn_" + (i+1));
              declineButton.onclick = function() {
                self.invite_btn_click('Declined', this.id);
              };
              td.appendChild(acceptButton);
              td.appendChild(document.createTextNode("  "));
              td.appendChild(declineButton);
            }
            tr.appendChild(td);
          }
        }
        invite_list.appendChild(document.createElement("br"));
        invite_list.appendChild(table);

      }
    );
  }

  self.invite_btn_click = function(response_clicked, current_id) {
    console.log("Determine which button was clicked in the invite list : " + response_clicked)
    current_id = current_id.slice(-1)
    var email_invited_from = document.getElementById("invite_from_email_"+ current_id).innerText

    $.post(
      update_invitation_response,
      {
        email_to : localStorage.getItem('user_email'),
        email_from: email_invited_from,
        response: response_clicked,
      }
    )

    // If accepted, update team member's class name , team name 
    $.post(
      set_team_details,
      {
        user_info : localStorage.getItem('user_email'),
        invited_by: email_invited_from,
      },
      function(){
        location.reload();
      }
    )
    
  }

  self.check_invitation_status = function(){
    console.log("Entered check invitation status ")
    if(localStorage.getItem("user_email") == ""){
    }else{
      $.getJSON(
        check_invitation_status,
        {
          invite_from : localStorage.getItem('user_email'),
        },
        function(data) {
          var invitationStatus = document.getElementById("invitationStatus");
          console.log(data.accounts_invited[0])
          if(data.accounts_invited.length == 0) invitationStatus.appendChild(document.createTextNode(" No Invitations Sent "))
            for(i = 0; i < data.accounts_invited.length ; i ++){
              var user_response = document.createElement("h1");
              var email_invited = data.accounts_invited[i].email_to_invite;
              var email_response = data.accounts_invited[i].recipient_response;
              user_response.appendChild(document.createTextNode("" + email_invited + "         -         " + email_response ))
              user_response.style.fontSize = "xx-large";
              user_response.style.fontFamily =  "Helvetica"
              invitationStatus.appendChild(user_response);
            }
        })
    }

  }

  self.load_existing_dashboard_data = function() {
    var user_email = localStorage.getItem('user_email')
    if(user_email == "" ){
      window.alert("Please Log In")
    }else{
      var sprint_info = []
      var duration_length;
      var sprint_start_date;
      // Get duration length and start date
      $.getJSON(
        get_project_date_details,
        {
          user_email : user_email
        },
        function(data){
          duration_length = data.length_of_sprint
          sprint_start_date = data.start_date
          document.getElementById("lengthOfSprint").value = duration_length
          document.getElementById("sprintStartDate").value = sprint_start_date
        }
      )

      // The hard part now is filling up the friggen user stories ... :'(
      $.getJSON(
          get_all_sprints,
          {
            user_email : user_email
          },
          function(data){
            console.log( data.data)
            var sprint_info = data.data
            console.log("number of sprints is " + data.num_of_sprints)

            if(data.num_of_sprints == 0 ){

            }else{
              // Populate Sprints 
              var num_of_sprints = data.num_of_sprints

              // Get the div element where user will fill in user stories and points
              var user_story_chart = document.getElementById(
                "user_story_details_after_sprint"
              );

              // If user wants to add different number of sprints, just re-start the div with that number of sprints
              while (user_story_chart.firstChild) {
                user_story_chart.removeChild(user_story_chart.firstChild);
              }

              // Create a div_sprint_and_story_i
              for (i = 0; i < num_of_sprints; i++) {
                // Create a <h> tag for each sprint and name it 'sprint_header_num(i)'
                var header_num = document.createElement("h2");
                header_num.setAttribute("id", "sprint_header_num" + (i + 1));
                var print_newline = document.createElement("br");
                // Fill the content of that header with "Sprint i"
                var sprint_label = document.createTextNode("Sprint " + (i + 1));
                // Attach content to header
                header_num.appendChild(sprint_label);
                // Create a div for each sprint and user story combo
                var sprint_divs = document.createElement("div");
                sprint_divs.setAttribute("id", "sprint_and_story_" + (i + 1));
                sprint_divs.className = "grid-x grid-container full"

                // Attach the header for the sprint to the div
                header_num.className = "cell work_done_class"
                sprint_divs.appendChild(header_num);
                // Add a button for this header to add story points
                var ask_for_num_of_stories_div = document.createElement("div");
                ask_for_num_of_stories_div.className = "grid-x grid-container full"
                ask_for_num_of_stories_div.setAttribute(
                  "id",
                  "ask_for_num_of_stories_div_" + (i + 1)
                );
                var num_of_stories_input = document.createElement("input");
                num_of_stories_input.className = "cell medium-5"
                num_of_stories_input.type = "number";
                num_of_stories_input.setAttribute(
                  "id",
                  "num_of_stories_input_" + (i + 1)
                );
                var header_button = document.createElement("BUTTON");
                var button_content = document.createTextNode(
                  "# of user stories"
                );
                header_button.setAttribute("id", i + 1);
                header_button.setAttribute("class", 'small button secondary cell medium-5');

                space_div1 = document.createElement("div")
                space_div2 = document.createElement("div")
                space_div2.className = "cell medium-2"
                space_div3 = document.createElement("div")


                header_button.onclick = function() {
                  self.load_user_story_chart(this.id);
                };

                header_button.appendChild(button_content);
                ask_for_num_of_stories_div.appendChild(space_div1);
                ask_for_num_of_stories_div.appendChild(num_of_stories_input);
                ask_for_num_of_stories_div.appendChild(space_div2);
                ask_for_num_of_stories_div.appendChild(header_button);
                sprint_divs.appendChild(ask_for_num_of_stories_div);
                ask_for_num_of_stories_div.appendChild(space_div3);
                // Attach the div to the main div that displays all sprints
                user_story_chart.appendChild(sprint_divs);
                user_story_chart.appendChild(print_newline);
              }

              var sprint_num_and_stry_num = []
              for( i = 0; i < num_of_sprints; i++){
                sprint_num_and_stry_num.push(0);
              }

              var sprint_count = 1
              for( i = 1 ; i <= sprint_info.length ; i ++){
                if(sprint_info[i-1].user_sprint_num == sprint_count){
                  sprint_num_and_stry_num[sprint_count-1]++;
                }else{
                  sprint_num_and_stry_num[sprint_count]++;
                  sprint_count++
                }
              }

              console.log("this is the array we created")
              console.log(sprint_num_and_stry_num)
              var story_pt_cter = 0;

              // Now we want to fill in the existing charts
              for(c = 0 ; c < num_of_sprints; c++ ){
    
                var num_of_stories = sprint_num_and_stry_num[c]
                var sprintNum = (c+1)
                //Code changed from : https://stackoverflow.com/questions/14643617/create-table-using-javascript
                var id_of_sprint = "ask_for_num_of_stories_div_" + (sprintNum);
                console.log("id of sprints = " + id_of_sprint)
                var myTableDiv = document.getElementById(id_of_sprint);
                console.log("this is the id of the sprint.. ")
                console.log(myTableDiv)
                if (myTableDiv.childNodes.length == 3) {
                  myTableDiv.childNodes[2].remove();
                }
                var table = document.createElement("TABLE");
                table.border = "1";
                var tableBody = document.createElement("TBODY");
                table.appendChild(tableBody);
                for ( i = 0; i < num_of_stories; i++) {
                  var tr = document.createElement("TR");
                  if (i == 0) {
                    var thUserStoryNumber = document.createElement("TH");
                    var thUserStoryPoints = document.createElement("TH");
                    thUserStoryNumber.appendChild(document.createTextNode("User Story"));
                    thUserStoryPoints.appendChild(document.createTextNode("Story Points"));
                    tableBody.append(thUserStoryNumber);
                    tableBody.append(thUserStoryPoints);
                  }
                  tableBody.appendChild(tr);
                  for (var j = 0; j < 2; j++) {
                    var td = document.createElement("TD");
                    td.width = "100";
                    if (j == 0) {
                      td.appendChild(document.createTextNode(" " + (i + 1) + " "));
                    } else {
                      td.setAttribute("id", "sn" + parseInt(sprintNum) + "sp" + (i + 1));
                      td.textContent = sprint_info[story_pt_cter].user_story_points
                      story_pt_cter++
                      td.contentEditable = "true";
                    }
                    tr.appendChild(td);
                  }
                }
                console.log("current sprint  is " + c)
                console.log("max sprint   is " + num_of_sprints)
                myTableDiv.appendChild(table);
              }
            }
          }
        )
    }
  }

  self.work_done_pie_chart = function() {
    console.log("Inside Work Done Pie Chart")
    console.log(document.getElementById("piechart_info").value)
    console.log("localStorage is " + localStorage.getItem('user_email')) 
    $.getJSON(
      set_team_contribution,
      {
        current_user: localStorage.getItem('user_email'),
        contribution_pts: document.getElementById("piechart_info").value
      },
      function(data) {
        $.getJSON(
          get_team_contribution,
          {
            current_user: localStorage.getItem('user_email')
          },
          function(data){
            // console.log(data.team_members);
            var members = data.team_members
            // console.log("Contribution : ")
            console.log("members is ")
            console.log(members)
            for(i = 0; i < members.length;i++){
              console.log("print here i is "  + i)
              console.log(members[i][0] + ' ' + members[i][1])
            }
    
            // Create the team contribution array to pass into the chart
            var array_to_pass = []
            for(i = 0; i <= members.length ; i++){
              if(i == 0 ){
                array_to_pass[0] = ['Member', 'Contribution Points']
              }else{
                array_to_pass[i] = [members[i-1][0], members[i-1][1]]
              }
            }
    
            console.log(array_to_pass)
    
            // At this point we have the team member's name and their contribution to the project 
            
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(drawChart(array_to_pass));
      
            function drawChart(array_to_pass) {
      
              var data = google.visualization.arrayToDataTable(array_to_pass);
      
              var options = {
                title: 'Team Contribution'
              };
      
              var chart = new google.visualization.PieChart(document.getElementById('piechart_work_done'));
      
              chart.draw(data, options);
            }          
          }
        )
      })

  }

  self.fill_account_settings_member_list = function(){
    console.log("fill account settings members list  ")
    var current_user_email = localStorage.getItem('user_email')
    if(current_user_email == ""){
      window.alert("Please Log In")
    }else{
      $.getJSON(
        get_team_members,
        {
          one_members_name: current_user_email
        },
        function(data) {
          console.log(data.team_members)
          var list_of_teammates = document.getElementById("list_of_members_account_page")
          console.log(list_of_teammates)
          for(i = 0 ; i < data.team_members.length ; i++){

            var css_length = 12 / data.team_members.length 
            var div = document.createElement("div")
            div.classList.add('cell');
            div.classList.add('medium-'+css_length)
            var userNode = document.createElement("div")
            var nameNode
            var emailNode
            var br = document.createElement("br");
  
            nameNode = document.createTextNode( data.team_members[i].first_name + ' ' + data.team_members[i].last_name )
            emailNode = document.createTextNode(data.team_members[i].email )
            userNode.appendChild(nameNode)
            userNode.appendChild(br)
            userNode.appendChild(emailNode)
  
            div.appendChild(userNode)
            div.style.fontSize = "xx-large";
            div.style.fontFamily =  "Helvetica"
            if(data.team_members[i].email == current_user_email)
            div.style.fontWeight = "650"
            list_of_teammates.appendChild(div)

          }
  
        })
    }
  }


  self.vue = new Vue({
    el: "#vue-div",
    delimiters: ["${", "}"],
    unsafeDelimiters: ["!{", "}"],
    data: {
      num_of_user_stories: "",
      num_of_sprints: "",
      length_of_sprint: "",
      sprint_start_date: "",
      work_done_list: [],
      total_story_points_list: []
    },
    methods: {
      go_to_backlog_graph: self.go_to_backlog_graph,
      go_to_work_done_graph: self.go_to_work_done_graph,
      go_to_progress_graph: self.go_to_progress_graph,
      go_to_account_settings: self.go_to_account_settings,
      set_user_story_details: self.set_user_story_details,
      get_backlog_story_points: self.get_backlog_story_points,
      load_chart_for_work_done: self.load_chart_for_work_done,
      update_wd_table: self.update_wd_table,
      get_work_done_data: self.get_work_done_data,
      get_progress_data: self.get_progress_data,
      register_user: self.register_user,
      log_in: self.log_in,
      log_out: self.log_out,
      populate_user_info: self.populate_user_info,
      add_user_story_for_sprints: self.add_user_story_for_sprints,
      drawSprintChart: self.draw_sprint_chart,
      send_email_invite : self.send_email_invite,
      invite_button: self.invite_button,
      populate_invite_list: self.populate_invite_list,
      invite_btn_click: self.invite_btn_click,
      check_invitation_status: self.check_invitation_status,
      work_done_pie_chart: self.work_done_pie_chart,
      fill_account_settings_member_list: self.fill_account_settings_member_list,
      load_existing_dashboard_data: self.load_existing_dashboard_data
    }
  });

  return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function() {
  APP = app();
});

$(document).ready(function() {
  $("#load_backlog").click();
  $("#work_done_load").click();
  $("#load_progress").click();
  $("#account_load").click();
  $("#dashboard_load").click();
});

// For navigation open and close from https://www.w3schools.com/howto/howto_js_sidenav.asp
/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}


