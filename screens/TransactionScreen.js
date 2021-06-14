import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView } from 'react-native';
import { render } from 'react-dom';
import { color } from 'react-native-reanimated';
import *as Permissions from 'expo-permissions' 
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import firebase from 'firebase';
import db from "../config";

export default class TransactionScreen extends React.Component {
  constructor(){
    super();
    this.state ={
      hasCameraPermissions: null,
      scanned: false,
      scannedData: "",
      scannedBookID: "",
      scannedStudentID: "",
      buttonState: 'normal',
      transactionMessage: ""

    }
  }

  getCameraPermissions =async(ID)=>{
    const {status} = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermissions: status === 'granted',
      buttonState: ID,
      scanned: false


    })
    
  }

  handleBarCodeScan =async({type, data} )=>{
    const {buttonState} = this.state
    if (buttonState === "BookID"){
      this.setState({
        scanned: true,
        scannedBookID: data,
        buttonState: "normal"
  
      })  
    }

    else if (buttonState === "StudentID"){
      this.setState({
        scanned: true,
        scannedStudentID: data,
        buttonState: "normal"
  
      })  

    }
    
  }

  


  initiateBookIssue =async()=>{
    //Adding a new field in the transaction DB 
    db.collection("transaction").add({
      'studentID': this.state.scannedStudentID,
      'bookID': this.state.scannedBookID,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "issue"
    })

    //Change book availabilty status
    db.collection("books").doc(this.state.scannedBookID).update({
      'bookAvailability': false

    })

    console.log("Book Availability Status is False");

    db.collection("students").doc(this.state.scannedStudentID).update({
      'noIssued': firebase.firestore.FieldValue.increment(1)
      
    })

    Alert.alert("Book is Issued");
    this.setState({
      scannedBookID: "",
      scannedStudentID: ""
    })

  }

  initiateBookReturn =async()=>{
    db.collection("transaction").add({
      'studentID': this.state.scannedStudentID,
      'bookID': this.state.scannedBookID,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "return"
    })

    db.collection("books").doc(this.state.scannedBookID).update({
      'bookAvailability': true


    })

    db.collection("students").doc(this.state.scannedStudentID).update({
      'noIssued': firebase.firestore.FieldValue.increment(-1)
      
    })

    Alert.alert("Book is Returned");
    this.setState({
      scannedBookID: "",
      scannedStudentID: ""
    })

    
  }

  checkEligibility = async()=>{
    const bookRef = await db.collection("books")
    .where("bookID", "==", this.state.scannedBookID)
    .get();

    var transactionType = "";
    if (bookRef.docs.length === 0){
      transactionType = false

    }

    else {
      bookRef.docs.map(
        (doc)=>{
          var book = doc.data();
          if(book.bookAvailability){
            transactionType = "issue";
          }

          else {
            transactionType = "return";
          }
        }
      )
    }

    return transactionType

  }

  checkStudentEligibilityForBookIssue = async()=>{
    var studentRef = await db.collection("students")
    .where("studentID", "==", this.state.scannedStudentID)
    .get();

    var isStudentEligible = "";

    if(studentRef.docs.length === 0){
      this.setState({
        scannedStudentID: "",
        scannedBookID: ""
      });

      isStudentEligible = false;
      Alert.alert("This Student ID does not exist in the database")
    }

    else {
      
      studentRef.docs.map(
        (doc)=>{
          var student = doc.data();
          if (student.noIssued < 2){
            isStudentEligible = true;
          } 

          else {
            isStudentEligible = false;
            Alert.alert("This student has issued the max amount of books");

            this.setState({
              scannedStudentID: "",
              scannedBookID: ""
            });

          }

        }
      ) 
    }

    return isStudentEligible


  }

  checkStudentEligibilityForBookReturn = async()=>{
    var transactionRef = await db.collection("transaction")
    .where("bookID", "==", this.state.scannedBookID)
    .limit(1)
    .get();

    var isStudentEligible = ""

    transactionRef.docs.map(
      (doc)=>{
        var lastTransaction = doc.data();

        if(lastTransaction.studentID === this.state.scannedStudentID){
          isStudentEligible = true;


        }
    
        else {
          isStudentEligible = false;
          Alert.alert("This book was not issued by the student");
          this.setState({
            scannedStudentID: "",
            scannedBookID: ""
          });
        }
      }


    );

    return isStudentEligible

    
  }

  handleTransaction = async()=> {
    var transactionType = await this.checkEligibility();
    if(!transactionType){
      Alert.alert("Not Eligible for Transaction");

    }

    else if (transactionType === "issue"){
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
      if (isStudentEligible){
        this.initiateBookIssue();
        Alert.alert("Book Issued To the Student");

      }
      
    }

    else {
      var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
      if (isStudentEligible){
        this.initiateBookReturn();
        Alert.alert("Book Returned To the Library");

      }
    }

  }

  render(){
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;
    if (buttonState !== 'normal' && hasCameraPermissions){
      return(
        <BarCodeScanner
        onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScan} 
        style = {StyleSheet.absoluteFillObject}
         /> 
        
      );



    }

    else if (buttonState === 'normal') {
      return (
        <KeyboardAvoidingView style = {styles.container} behavior = "height" enabled>
          <View style = {styles.logoContainer}>
            <Ionicons
            name = "book-outline"
            size = {50}
            color = "blue"

             />


          </View>
          <View style = {styles.container}>
            <TextInput placeholder = "Student ID" 
            value = {this.state.scannedStudentID} 
            style = {styles.inputField}
            onChangeText = {(text)=>{
              this.setState({
                scannedStudentID: text
              })

            }} 
            />
            

            <TouchableOpacity style = {styles.buttonBackground} onPress = {
              ()=>{
                this.getCameraPermissions("StudentID")

              }
            }>
              <Text style = {{color: "white", textAlign: "center"}}>
                Scan
              </Text>
            </TouchableOpacity>
    

          </View>

          <View style = {styles.container}>
          <TextInput 
          placeholder = "Book ID" 
          value = {this.state.scannedBookID} 
          style = {styles.inputField}
          onChangeText = {(text)=>{
            this.setState({
              scannedBookID: text
            })

          }}  
          />

          <TouchableOpacity style = {styles.buttonBackground} onPress = {
              ()=>{
                this.getCameraPermissions("BookID")

              }
            }>
            <Text style = {{color: "white", textAlign: "center"}}>
              Scan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style = {styles.submitButtonBackground}
          onPress ={async()=>{
            var transactionMessage = await this.handleTransaction();
            
          this.setState({
            scannedStudentID: "",
            scannedBookID: ""
          })       
           
          }} 
   
          
          
          >
            <Text style = {{color: "white", textAlign: "center"}}>
              Submit
            </Text>
            
          </TouchableOpacity>


          </View>
            {/* <Text style = {styles.textSize}>
               {hasCameraPermissions === true ? this.state.scannedData : "Request Camera Permissions"}
            </Text>

            <TouchableOpacity 
            style = {styles.buttonBackground} 
            onPress = {this.getCameraPermissions}
            >
            <Text style = {{color: "white", textAlign: "center"}}>
              Scan QR Code
              </Text>  

            </TouchableOpacity> */}
        </KeyboardAvoidingView>
    );


                  
    }
  } 

  }

  const styles = StyleSheet.create({
    container : {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center' 

    },

    buttonBackground : {
      backgroundColor: "black",
      width: 250,
      textAlign: 'center',
      alignItems:'center',
      justifyContent: 'center',
      marginTop: 20,
      padding: 15,
      height: 55,
      borderRadius: 6,
      marginBottom: 20
    },

    textSize : {
      fontSize: 20,
      textDecorationLine: 'underline'

    },

    inputField : {
      borderWidth: 2,
      borderColor: "black",
      width: 200,
      height: 55,
      padding: 15,
      marginBottom: 20,
      textAlign: 'center',
      alignItems:'center',
      justifyContent: 'center',
    },

    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 100 
      
    },

    submitButtonBackground : {
      backgroundColor: "blue",
      width: 200,
      textAlign: 'center',
      alignItems:'center',
      justifyContent: 'center',
      marginTop: 20,
      padding: 15,
      height: 55,
      borderRadius: 6,
      marginBottom: 20
    }

  })