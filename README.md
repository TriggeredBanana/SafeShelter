# ** Gruppe 6 - Assignment 2 **

# Group Members:
# Sigurd Munk Brekke - sigurdmb@uia.no
# Daniel Danvik Møgster - danieldm@uia.no
# Ole Bjørk Olsen - danielbj@uia.no
# Emil Stokken Kaasa - emilsk@uia.no
# Sigurd Bøthun Mæland - sigurdbm@uia.no
# Henrik Sæverud Lorentzen - henriksl@uia.no

# Assignment
"An interactive map project for researching the availability safety shelters in case a a fire or flood" 

---

## **Table of Contents**

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Technological Choices and Architecture](#technological-choices-and-architecture)
- [Data Sources and Processing](#data-sources-and-processing)
- [Backend/API Implementation](#backend-api-implementation)
- [Frontend and Visualization](#frontend-and-visualization)

---

## **Overview**

This project is part of a university assignment where students develop an interactive map application using Leaflet. The project integrates open data, backend APIs, and visualizations to address a specific thematic problem statement. The group thematic problem statement is: being where and how to access safety shelters in case of an emergency fire or flood.

---

## **Problem Statement**

- Vizualize where the emergency shelters are located, and how    to get to them and access them during a crisis.
- Vizualize particulary exposed areas for crisises as flooding and fire, and mapping these. 
- Showing flood and fire risk areas based on meteorological data

---

## **Technological Choices and Architecture**

- **Frontend:** Leaflet.js for map visualization, HTML/CSS, and JavaScript.
- **Backend:** Supabase
- **Database:** Supabase
- **Data Processing:** QGIS for data management and geospatial data processing, Python for data transformation
- **Data Sources:** GeoNorge

---

## **Data Sources and Processing**

- **Datasets:**
    - [Brannstasjoner] from [https://kartkatalog.geonorge.no/metadata/brannstasjoner/0ccce81d-a72e-46ca-8bd9-57b362376485?search=Brannstasjoner]

    - [Flomsoner] from [https://kartkatalog.geonorge.no/metadata/flomsoner/e95008fc-0945-4d66-8bc9-e50ab3f50401]
    
    - [TilfluktsromOffentlige] from [https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8?search=Tilfluk]

    - All the files listed here are PostGIS

- **Data Processing Tools:**
    - QGIS for geospatial analysis and file conversion
    - Python scripts for cleaning and transforming the dataset


---

## **Backend/API Implementation**

The backend is implemented using supabase as the database, which allows the group/users to visualize the shcematics, as well as easy access to the tables and the data within. As this service is easy to use, it was the best choice for the group. The biggest downside is arguably that it has a limit of 500 MB, which works fine in within this project, but bigger projects may need bigger database space allocation. 

### **Key API Endpoints:**

|Endpoint|Method|Description|
|---|---|---|
|`/api/get-data`|GET|Retrieves data from Supabase|
|`/api/process-data`|POST|Processes uploaded geospatial data|

---

## **Frontend and Visualization**

The frontend uses Leaflet.js for interactive map visualizations and basic HTML/CSS and JavaScript for interface / GUI interactivity

### **Features:**

- 📍 Dynamic markers loaded from Supabase
- 🌍 Multiple basemap layers
- 📊 Data overlays visualized on the map

### **Instructions:**

 
Sample functionality includes:

- **Zoom and Pan:** Standard map navigation
- **Data Layer Toggle:** Show/hide data layers


---
