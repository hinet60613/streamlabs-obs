<template>
<modal-layout
  :showControls="false"
  title="Add Source">

  <div slot="content">

    <div v-if="sourceType != 'scene'">
      <div class="row">
        <div class="column small-12">
          <h4>Add New Source</h4>
          <p
            v-if="!error"
            class="NameSource-label">
            Please enter the name of the source
          </p>
          <p v-if="error"
            class="NameSource-label NameSource-label__error">
            {{ error }}
          </p>
          <input autofocus type="text" v-model="name"/>
        </div>
      </div>
      <div class="row">
        <div class="columns small-12 buttons">
          <button @click="addNew" class="button button--action">Add New Source</button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="columns small-12">
        <h4>Add Existing Source</h4>
      </div>
    </div>
    <div class="sources-browser row">
      <div class="small-6 columns">
        <selector
            class="studio-controls-selector"
            :draggable="false"
            @dblclick="addExisting"
            @select="sourceId => { selectedSourceId = sourceId }"
            :activeItems="selectedSourceId ? [selectedSourceId] : []"
            :items="existingSources">
        </selector>
      </div>
      <div class="small-6 columns">
        <SourcePreview :sourceId="selectedSource.id"/>
      </div>
    </div>

    <div class="row">
      <div class="columns small-12 buttons">
        <button @click="addExisting" class="button button--action">Add Existing Source</button>
      </div>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./AddSource.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.NameSource-label {
  margin-bottom: 10px;
}

.NameSource-label__error {
  color: red;
}

.sources-container {
  padding: 20px;
  display: flex;
  flex: 1 0 auto;
  height: 170px;

  > div {
    flex: 1 0 50%;
  }
}

.sources-browser {

  .columns:first-child {
    display: flex;
  }

  .columns {
    height: 170px;
  }
}

.columns.buttons {
  text-align: right;
  padding-top: 20px;
  padding-bottom: 20px;
}

</style>
