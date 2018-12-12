def set_project_details():
    num_sprints = int(request.vars.num_of_sprints)
    length_of_sprint = int(request.vars.length_of_sprint)
    sprint_start_date= (request.vars.sprint_start_date)
    user_email = request.vars.user_email

    team_exists = db(db.user_info.email == user_email).select()
    team_name = team_exists[0].team_name 

    # Check to see if we're updating new or old values
    rows = db(db.project_details.team_name == team_name).select()

    if(len(rows) == 0):
        db.project_details.update_or_insert(
            num_of_sprints = num_sprints,
            length_of_sprints = length_of_sprint,
            sprint_start_date = sprint_start_date,
            team_name = team_name,
            # sprints_start_date = sprint_start_date
        )
    else:
        db.work_completed.update_or_insert(
            (db.project_details.team_name == team_name),
            num_of_sprints = num_sprints,
            length_of_sprints = length_of_sprint,
            sprint_start_date = sprint_start_date,
        )


# Gets story points for a specific user story number
def get_story_points():
    user_email = request.vars.user_email
    team_exists = db(db.user_info.email == user_email).select()
    team_name = team_exists[0].team_name 
    rows = db(db.user_stories.user_story_team_name == team_name).select(orderby=db.user_stories.user_story_num)
    size = len(rows)
    story_points_list = [None] * size

    for x in range (1, size+1):
        story_points_list[x-1] = [int(rows[x-1].user_story_num), rows[x-1].user_story_points]


    num_of_sprints = db(db.project_details.team_name == team_name).select()
    num_of_sprints_final = int(num_of_sprints[0].num_of_sprints) 
    rows1 = db(db.user_stories.user_story_team_name == team_name).select(orderby=db.user_stories.user_sprint_num|db.user_stories.user_story_num)
    size1 = len(rows1)
    story_points_list1 = [0] * num_of_sprints_final
    index_counter = 1
    
    for x in rows1:
        temp = int(x.user_sprint_num)
        story_pts = int(x.user_story_points)
        if ( temp == index_counter):
            story_points_list1[index_counter-1] += story_pts
        else:
            story_points_list1[index_counter] += story_pts
            index_counter += 1

    return response.json(dict(answer = story_points_list, ideal = story_points_list1 ))

# Get the details of each user story in a sprint
def get_all_story_points_of_a_sprint():
    sprint_num = int(request.vars.sprint_num) 
    user_email = request.vars.user_email
    team_exists = db(db.user_info.email == user_email).select()
    team_name = team_exists[0].team_name 

    rows = db((db.user_stories.user_story_team_name == team_name) & (db.user_stories.user_sprint_num == sprint_num)).select()

    story_point_list = [0]*len(rows)

    for x in rows:
        story_point_list[int(x.user_story_num)-1] = x.user_story_points

    # rowlength = len(rows)

    return response.json(dict(answer = story_point_list, sprint = sprint_num))

def get_project_details():
    user_email = request.vars.user_email
    team_exists = db(db.user_info.email == user_email).select()
    team_name = team_exists[0].team_name 
    rows = db(db.project_details.team_name == team_name).select()
    if(len(rows) > 0 ):
        num_of_sprints = rows[0].num_of_sprints
    else:
        num_of_sprints = None
    # num_of_sprints = rows.project_details.num_of_sprints
    return num_of_sprints

def get_project_date_details():
    user_email = request.vars.user_email
    team_exists = db(db.user_info.email == user_email).select()
    team_name = team_exists[0].team_name 
    rows = db(db.project_details.team_name == team_name).select()
    start_date = rows[0].sprint_start_date
    length_of_sprint = rows[0].length_of_sprints
    
    
    # num_of_sprints = rows.project_details.num_of_sprints
    return response.json(dict(start_date = start_date, length_of_sprint = length_of_sprint))

def set_work_done_data():
    sprint_num = int(request.vars.sprint_num)
    story_points = int(request.vars.story_points)
    user_email = request.vars.email
    team_exists = db(db.user_info.email == user_email).select()
    team_name = team_exists[0].team_name 
    highest_sprint = int(request.vars.highest_sprint)

    # Check to see if we're updating new or old values
    rows = db((db.work_completed.team_name == team_name) & (db.work_completed.sprint_number == sprint_num)).select()
    #  Delete old values if there exists any
    if(sprint_num == highest_sprint):
        db((db.work_completed.sprint_number > sprint_num) & (db.work_completed.team_name == team_name) ).delete()

    if (len(rows) == 0):
        db.work_completed.update_or_insert(
            sprint_number = sprint_num,
            story_points = story_points,
            team_name = team_name,
        )
    else:    
    # If user story email and number are a match, update the new story points
        db.work_completed.update_or_insert(
            (db.work_completed.team_name == team_name) & (db.work_completed.sprint_number == sprint_num),
            story_points = story_points,
        )
    return sprint_num


def set_user_story_points():
    story_num = int(request.vars.story_num)
    sprint_num = int(request.vars.sprint_num)
    story_points = int(request.vars.story_points)
    story_email = request.vars.story_email
    remove_strynum_past_this = int(request.vars.highest_story_num)
    remove_sprints_past_this = int(request.vars.highest_sprint_num)
    lastValue = False

    team_exists = db(db.user_info.email == story_email).select()
    team_name = team_exists[0].team_name 
    # If a user wants to reduce the number of user stories, remove existing user stories past the highest one.
    
    if(remove_strynum_past_this == story_num):
        db((db.user_stories.user_sprint_num == sprint_num) & (db.user_stories.user_story_num > story_num)).delete()
     # If user wants to change the number of sprints, remove existing sprints past the highest sprint number
    if(remove_sprints_past_this == sprint_num):
        db(db.user_stories.user_sprint_num > remove_sprints_past_this).delete()


    # Check to see if we're updating new or old values
    rows = db((db.user_stories.user_story_team_name == team_name) 
    & (db.user_stories.user_story_num == story_num)
    & (db.user_stories.user_sprint_num == sprint_num)
    ).select()


    # If rows.length > 0, then a user has already assigned a sprint number, story number, and points. Thus, just update the points..
    if (len(rows) == 0):
        db.user_stories.insert(
            user_story_num = story_num,
            user_story_points = story_points,
            user_story_team_name = team_name,
            user_sprint_num = sprint_num
        )
    else:
        db((db.user_stories.user_story_team_name == team_name) & (db.user_stories.user_story_num == story_num) & (db.user_stories.user_sprint_num == sprint_num)).update(user_story_points = story_points)
    # If user story email and number are a match, update the new story points

    # indicate when we're at the last user story
    if (story_num == remove_strynum_past_this and sprint_num == remove_sprints_past_this):
        lastValue = True
    return lastValue 


def get_work_done_data():
    user_email = request.vars.user_email
    team_exists = db(db.user_info.email == user_email).select()
    team_name = team_exists[0].team_name 
    rows = db(db.work_completed.team_name == team_name).select(orderby=db.work_completed.sprint_number)
    size = len(rows)
    work_done_list = [None] * size

    for x in range (1, size+1):
        work_done_list[x-1] = [rows[x-1].sprint_number, rows[x-1].story_points]
    return response.json(dict(answer = work_done_list))

def set_user_info():
    first_name = request.vars.first_name
    last_name = request.vars.last_name
    email = request.vars.email
    password = request.vars.password
    team_name = request.vars.team_name
    class_name = request.vars.class_name

    db.user_info.update_or_insert(
        first_name = first_name,
        last_name = last_name,
        email = email,
        class_name = class_name,
        password = password,
        team_name = team_name
    )
    return "Data stored"

def check_log_in():
    username = request.vars.login_email
    password = request.vars.login_password

    rows = db((db.user_info.email == username) & (db.user_info.password == password)).select()

    # Only have 5 fields for user information 
    user_info_list = [None] * 5

    if(len(rows) != 0):
        # Store fire name
        user_info_list[0] = rows[0].first_name
        # Store last name
        user_info_list[1] = rows[0].last_name
        # Store email
        user_info_list[2] = rows[0].email
        # Store class name
        user_info_list[3] =  rows[0].class_name
        # Store team name
        user_info_list[4] = rows[0].team_name


    return response.json(dict(user_info_list = user_info_list))


def get_user_info():
    username = request.vars.login_email


    rows = db(db.user_info.email == username).select()

    # Only have 5 fields for user information 
    user_info_list = [None] * 5

    if(len(rows) != 0):
        # Store fire name
        user_info_list[0] = rows[0].first_name
        # Store last name
        user_info_list[1] = rows[0].last_name
        # Store email
        user_info_list[2] = rows[0].email
        # Store class name
        user_info_list[3] =  rows[0].class_name
        # Store team name
        user_info_list[4] = rows[0].team_name


    return response.json(dict(user_info_list = user_info_list))


def total_story_points_for_sprint():
    num_of_sprints = int(request.vars.num_of_sprints)
    user_email = request.vars.user_email
    team_exists = db(db.user_info.email == user_email).select()
    team_name = team_exists[0].team_name 
    rows = db(db.user_stories.user_story_team_name == team_name).select()

    total_story_points_list = [0] * num_of_sprints
    for x in rows:
        index = (int(x.user_sprint_num)-1)
        if(total_story_points_list[index] == 0):
            total_story_points_list[index] = int(x.user_story_points)
        else:
            total_story_points_list[index] += int(x.user_story_points)
    # For each data point for our user, check the sprint number and sprint points
    # Create an array of size num of sprints
    # For each index, we will sum up the total number of user story points
    return response.json(dict(total_story_points_list = total_story_points_list))


def set_email_to_invite_list():
    invite_email = request.vars.invite_email
    team_owner = request.vars.team_owner
    response = request.vars.response

    # Get the team information from the team owner's email
    rows = db(db.user_info.email == team_owner).select()

    db.invite_list.update_or_insert(
        team_owner_email = team_owner,
        email_to_invite = invite_email,
        team_name = rows[0].team_name,
        team_owner_name = rows[0].first_name,
        recipient_response = response
    )

    return rows[0].class_name


def get_invite_list():
    user = request.vars.invites_for_this_user
    rows = db((db.invite_list.email_to_invite == user) & (db.invite_list.recipient_response == 'Not Responded')).select()
    amt_of_invites = len(rows)
    return response.json(dict(amt = rows))

def check_invitation_status():
    user = request.vars.invite_from
    rows = db(db.invite_list.team_owner_email == user).select()
    return response.json(dict(accounts_invited = rows))


def update_invitation_response():
    email_from = request.vars.email_from
    email_to = request.vars.email_to
    response = request.vars.response
    db.invite_list.update_or_insert(
        (db.invite_list.team_owner_email == email_from) & (db.invite_list.email_to_invite == email_to),
        recipient_response = response
    )
    return "helo"

def set_team_details():
    current_user = request.vars.user_info
    invited_by = request.vars.invited_by

    # Get team name and class from invited email 
    invited_by_details = db(db.user_info.email == invited_by).select()

    # Update current team's team name and class name
    db.user_info.update_or_insert(
        (db.user_info.email == current_user),
        class_name = invited_by_details[0].class_name,
        team_name = invited_by_details[0].team_name
    )

def get_team_members():
    member_email = request.vars.one_members_name

    # Get the team name based off of one of the member's email
    member_detail = db(db.user_info.email == member_email).select()

    team_name = member_detail[0].team_name


    # Get all the members with the same name
    team_members = db(db.user_info.team_name == team_name).select()

    return response.json(dict(team_members = team_members))

def set_team_contribution():
    index_counter = 0
    current_user = request.vars.current_user
    contribution_pts = int(request.vars.contribution_pts)
    # Get Team Name so we can find all members of that team 
    member_detail = db(db.user_info.email == current_user).select()
    team_name = member_detail[0].team_name

    # This has a list of all team members 
    team_members = db(db.user_info.team_name == team_name).select()

    # First, update contribution of current user
    current_user_full_name = member_detail[0].first_name + ' ' + member_detail[0].last_name
    db.team_details.update_or_insert(
        (db.team_details.team_name == team_name) & (db.team_details.team_member_name == current_user_full_name),
        team_name = team_name,
        team_member_name = current_user_full_name,
        contribution_pts = contribution_pts
    )
    return response.json(dict(team_members = "nothing here"))

def get_team_contribution():
    index_counter = 0
    current_user = request.vars.current_user
    # Get Team Name so we can find all members of that team 
    member_detail = db(db.user_info.email == current_user).select()
    team_name = member_detail[0].team_name

    # This has a list of all team members 
    team_members = db(db.user_info.team_name == team_name).select()

    #  Return a list of all members who have contributed to the project
    team_members_list = [0] * len(team_members)
    # For each member, create a list of the member's name + their contribution pointst
    for x in team_members:
        member_first_name = team_members[index_counter].first_name
        member_last_name = team_members[index_counter].last_name
        # member_team_name = team_members[index_counter].team_name
        member_full_name = member_first_name + ' ' + member_last_name
        a_member = db(db.team_details.team_member_name == member_full_name).select()

        if(len(a_member) == 0):
            team_members_list[index_counter] = [member_full_name, 0]
        else:
            # Now we have a member on the team and their contribution, add it to our list 
            team_members_list[index_counter] = [member_full_name, a_member[0].contribution_pts]
        index_counter += 1

    return response.json(dict(team_members = team_members_list))


def get_all_sprints():
    user_email = request.vars.user_email
    # Get the team name based off of one of the member's email
    member_detail = db(db.user_info.email == user_email).select()
    team_name = member_detail[0].team_name

    # Get num of sprints
    temp = db(db.project_details.team_name == team_name).select()
    num_of_sprints = temp[0].num_of_sprints

    # First,get al the data of sprints related to the team name
    rows = db(db.user_stories.user_story_team_name == team_name).select(orderby=db.user_stories.user_sprint_num|db.user_stories.user_story_num)
    return response.json(dict(data = rows, num_of_sprints = num_of_sprints))


def get_user_work_done():
    user_email = request.vars.user_email
    # Get the team name based off of one of the member's email
    member_detail = db(db.user_info.email == user_email).select()
    team_name = member_detail[0].team_name
    member_name = member_detail[0].first_name +  ' ' + member_detail[0].last_name

    rows = db((db.team_details.team_member_name == member_name) & (db.team_details.team_name == team_name)).select()
    if(len(rows) > 0):
        pts = rows[0].contribution_pts
    else:
        pts = 0
    return pts