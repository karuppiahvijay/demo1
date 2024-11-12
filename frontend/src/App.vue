<template>
  <div id="app">
    <h1>Person Details</h1>
    <ul>
      <li v-for="person in people" :key="person.id">
        {{ person.name }} - {{ person.age }} - {{ person.address }}
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      people: []
    };
  },
  created() {
  axios.get('http://127.0.0.1:3000/person')
    .then(response => {
      this.people = response.data;
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}
};
</script>

<style scoped>
#app {
  text-align: center;
  margin-top: 50px;
}
</style>
