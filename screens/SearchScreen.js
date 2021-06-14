import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Touchable, Alert} from 'react-native';
import { render } from 'react-dom';
import firebase from 'firebase';
import db from "../config";
import { ScrollView } from 'react-native-gesture-handler';


export default class SearchScreen extends React.Component {
  constructor(){
    super();
    this.state = {
      allTransactions : [],
      search: "",
      lastVisibleTransaction: null
    }
  }

  searchTransaction =async(text)=>{
    // var text = this.state.search.toUpperCase()
    var enteredText = text.split("")
    Alert.alert(enteredText)
    if (enteredText[0].toUppercase() === "B"){
      const transaction = await db.collection("transaction").where("bookID", "==", text).get()
      transaction.docs.map(()=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })
        Alert.alert("search transaction")
      })


      

    }

    else if (enteredText[0].toUppercase() === "S"){
      const transaction = await db.collection("transaction").where("studentID", "==", text).get()
      transaction.docs.map(()=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })

      })

    }

  }

  fetchMoreTransaction =async()=>{
    var text = this.state.search.toUpperCase()
    var enteredText = text.split("")
    if (enteredText[0].toUppercase() === "B"){
      const transaction = await db.collection("transaction").where("bookID", "==", text).get()
      transaction.docs.map(()=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })

      })

    }

    else if (enteredText[0].toUppercase() === "S"){
      const transaction = await db.collection("transaction").where("studentID", "==", text).get()
      transaction.docs.map(()=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })

      })

    }

  }

  componentDidMount =async()=>{
    const searchQuery = await db.collection("transaction").limit(10).get()
    searchQuery.docs.map((doc)=>{
      this.setState({
        allTransactions : [],
        lastVisibleTransaction: doc
      })

    })
  }



  render(){
    return (
        <View>
          <View style = {styles.searchBarWrapper}>
            <TextInput 
            
            style = {styles.searchBar}
            placeholder = "Search for availability"
            onChangeText = {(text)=>{
              this.setState({
                search: text
              })

            }} 
            
            
            />

            <TouchableOpacity 
            onPress = {()=>{
              this.searchTransaction()
            }}

            style = {styles.searchButton}
            
            
            >
              <Text style = {styles.searchText}>
                Search 
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList 
          
          data = {this.state.allTransactions}

          renderItem = {({item})=>(
            <View style = {styles.listBorderBottom}>
              <Text>
                {"Book ID is: " + item.bookID}
              </Text>

              <Text>
                {"Date transacted is: " + item.date}
              </Text>

              <Text>
                {"Transaction type is: " + item.transactionType}
              </Text>

              <Text>
                {"Student ID is: " + item.studentID}
              </Text>


              </View>


          )}
          keyExtractor = {(item, index)=>{
            index.toString()

          }}

          onEndReached = {()=>{
            this.fetchMoreTransaction()
          }}
          onEndReachedThreshold = {0.75}
          
          />

        </View>
    );
  } 

  }


  const styles = StyleSheet.create({
    listBorderBottom: {
      borderBottomWidth: 2,
      borderColor : "blue"
    },

    searchBar: {
      height: 55,
      padding: 15,
      width: 250,
      justifyContent: 'center',
      backgroundColor: '#EEE'

    },

    searchBarWrapper: {
      flexDirection: "row",
      marginTop: 40,
      width: "100%",
      alignItems: 'center',



    },

    searchButton : {
      height: 55,
      width: 55,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'black'
    },

    searchText: {
      color: "white",

    }
  })