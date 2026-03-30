from flask import Flask, request, render_template, redirect, url_for
from sqlalchemy import create_engine, text

app = Flask(__name__)

engine = create_engine('sqlite:///.database/cyberwatch.db') #link to the cyberwatch database here

#route for index.html
@app.route('/')
def home():
    
    with engine.connect() as connection:
        # This way of connecting to the database 
        # ensures that the connection is automatically closed as soon as the function finishes
        query = text('SELECT * FROM vulnerabilities ORDER BY owasp_rank;')
        result = connection.execute(query).fetchall()

    return render_template('index.html', vulnerabilities=result)

@app.route('/incidents/<vul_id>')
def incident_page(vul_id):
    # TASK 1: Connect to the database
    # TASK 2: Fetch the Vulnerability Name for the heading (JOIN or separate query)
    # TASK 3: Fetch all Incidents linked to this vul_id, return incidents list
    with engine.connect() as connection:
        query = text('SELECT inc_name, inc_url FROM incidents WHERE vul_id = {};'.format(vul_id))
        result = connection.execute(query).fetchall()
        new_query = text('SELECT vul_name FROM vulnerabilities WHERE id = {};'.format(vul_id))
        new_result = connection.execute(new_query).fetchall()

    print(vul_id) #this is a print statement to help you understand what data is being returned
    return render_template('incidents.html', vulnerability = new_result, incidents = result, vul_id = vul_id)

@app.route('/add-incident/<vul_id>', methods=['GET'])
def add_incident(vul_id):
    print(vul_id)
    return render_template('add-incident.html', vul_id = vul_id)

@app.route('/add-incident/', methods=['POST'])
def add_new_incident():
    company_name = request.form['inc_name']
    incident_url = request.form['inc_url']
    incident_year = request.form['inc_year']
    vulnerability_id = request.form['vul_id']
    print(incident_url)

    insert_statement = '''
        INSERT INTO incidents (vul_id, inc_name, inc_url, inc_year)
        VALUES ({}, '{}', '{}', {});
    '''.format(vulnerability_id, company_name, incident_url, incident_year)

    with engine.connect() as connection:
        connection.execute(text(insert_statement))
        connection.commit()
    
    # return redirect(url_for('home'))

    return render_template('add-incident.html')

app.run(debug=True, reloader_type='stat', port=3000)