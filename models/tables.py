# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

# logger.info("The user record is: %r" % auth.user)

import datetime


def get_user_email():
    return None if auth.user is None else auth.user.email

def get_current_time():
    return datetime.datetime.utcnow()

db.define_table('project_details',
                Field('num_of_sprints'),
                Field('length_of_sprints'),
                Field('sprint_start_date'),
                Field('team_name')
                )

db.define_table('user_stories',
                Field('user_sprint_num'),
                Field('user_story_num'),
                Field('user_story_points'),
                Field('user_story_team_name')
                )

db.define_table('work_completed',
                Field('sprint_number'),
                Field('story_points'),
                Field('team_name')           
                )

db.define_table('user_info',
                Field('first_name'),
                Field('last_name'),
                Field('email'),
                Field('class_name'),
                Field('password'),
                Field('team_name')          
                )

db.define_table('team_details',
                Field('team_name'),
                Field('team_member_name'),
                Field('contribution_pts', 'integer', default= 0)
                )

db.define_table('invite_list',
                Field('team_name'),
                Field('team_owner_email'),
                Field('team_owner_name'),
                Field('email_to_invite'),
                Field('recipient_response')
                )