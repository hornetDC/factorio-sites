/** @jsx jsx */
import React, { ReactNode, useEffect, useState } from "react";
import { jsx, css } from "@emotion/core";
import { NextPage, NextPageContext } from "next";
import BBCode from "bbcode-to-react";
import { Button, Grid } from "@chakra-ui/core";
import {
  BlueprintBookEntry,
  BlueprintEntry,
  BlueprintPageEntry,
  getBlueprintBookById,
  getBlueprintById,
  getBlueprintPageById,
  hasBlueprintImage,
} from "@factorio-sites/database";
import { BlueprintData, timeLogger } from "@factorio-sites/common-utils";
import { chakraResponsive, parseBlueprintStringClient } from "@factorio-sites/web-utils";
import { Panel } from "../../src/Panel";
import { Markdown } from "../../src/Markdown";
import { FullscreenImage } from "../../src/FullscreenImage";
import { BookChildTree } from "../../src/BookChildTree";
import { CopyButton } from "../../src/CopyButton";

const imageStyle = css`
  display: flex;
  justify-content: center;
  &:hover {
    cursor: pointer;
  }
`;

type Selected =
  | { type: "blueprint"; data: Pick<BlueprintEntry, "id" | "blueprint_hash" | "image_hash"> }
  | { type: "blueprint_book"; data: Pick<BlueprintBookEntry, "id" | "blueprint_hash"> };

interface IndexProps {
  image_exists: boolean;
  selected: Selected;
  blueprint: BlueprintEntry | null;
  blueprint_book: BlueprintBookEntry | null;
  blueprint_page: BlueprintPageEntry;
}

export const Index: NextPage<IndexProps> = ({
  image_exists,
  selected,
  blueprint,
  blueprint_book,
  blueprint_page,
}) => {
  const [imageZoom, setImageZoom] = useState(false);
  const [blueprintString, setBlueprintString] = useState<string | null>(null);
  const [data, setData] = useState<BlueprintData | null>(null);
  const [showJson, setShowJson] = useState(false);

  const selectedHash = selected.data.blueprint_hash;

  useEffect(() => {
    fetch(`/api/string/${selectedHash}`)
      .then((res) => res.text())
      .then((string) => {
        setShowJson(false);
        setBlueprintString(string);
        if (selected.type === "blueprint") {
          const { data } = parseBlueprintStringClient(string);
          setData(data);
        } else {
          setData(null);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHash]);

  useEffect(() => {
    console.log({
      image_exists,
      selected,
      blueprint,
      blueprint_book,
      blueprint_page,
    });
  }, []);

  const renderImage = () => {
    let render: ReactNode;
    if (selected.type === "blueprint_book") {
      render = <div>Can't show image for a book, select a blueprint to the the image</div>;
    } else if (!image_exists) {
      render = <div>The image is not generated yet</div>;
    } else if (imageZoom) {
      render = (
        <FullscreenImage
          close={() => setImageZoom(false)}
          alt="blueprint"
          src={`https://storage.googleapis.com/blueprint-images/${selected.data.image_hash}.webp`}
        />
      );
    } else {
      render = (
        <div onClick={() => setImageZoom(true)}>
          <img
            alt="blueprint"
            src={`https://storage.googleapis.com/blueprint-images/${selected.data.image_hash}.webp`}
          />
        </div>
      );
    }
    return <div css={imageStyle}>{render}</div>;
  };

  return (
    <Grid
      margin="0.7rem"
      templateColumns={chakraResponsive({ mobile: "1fr", desktop: "1fr 1fr" })}
      gap={6}
    >
      <Panel title={blueprint_page.title} gridColumn="1">
        {blueprint_book ? (
          <>
            <div>This string contains a blueprint book </div>
            <br />
            <BookChildTree
              child_tree={[
                {
                  id: blueprint_book.id,
                  name: blueprint_book.label,
                  type: "blueprint_book",
                  children: blueprint_book.child_tree,
                },
              ]}
              base_url={`/blueprint/${blueprint_page.id}`}
              selected_id={selected.data.id}
            />
          </>
        ) : blueprint ? (
          <>
            <div>This string contains one blueprint</div>
            <div>tags: {blueprint.tags.join(", ")}</div>
          </>
        ) : null}
      </Panel>
      <Panel
        title={image_exists ? undefined : "Image"}
        gridColumn={chakraResponsive({ mobile: "1", desktop: "2" })}
        gridRow={chakraResponsive({ mobile: "1", desktop: undefined })}
      >
        {renderImage()}
      </Panel>

      <Panel
        title="Description"
        gridColumn={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}
      >
        <Markdown>{blueprint_page.description_markdown}</Markdown>
      </Panel>
      {selected.type === "blueprint" && data && (
        <Panel
          title={(<span>Entities for {BBCode.toReact(data.blueprint.label)}</span>) as any}
          gridColumn={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}
        >
          <table>
            <tbody>
              {Object.entries(
                data.blueprint.entities.reduce<Record<string, number>>((entities, entity) => {
                  if (entities[entity.name]) {
                    entities[entity.name]++;
                  } else {
                    entities[entity.name] = 1;
                  }
                  return entities;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .map(([entry_name, entry]) => (
                  <tr key={entry_name} css={{}}>
                    <td css={{ border: "1px solid #909090" }}>
                      <img
                        alt={entry_name.replace(/-/g, " ")}
                        src={`https://factorioprints.com/icons/${entry_name}.png`}
                      />
                    </td>
                    <td css={{ padding: "5px 10px", border: "1px solid #909090" }}>{entry_name}</td>
                    <td css={{ padding: "5px 10px", border: "1px solid #909090" }}>{entry}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
      )}
      <Panel title="string" gridColumn={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}>
        <>
          {blueprintString && <CopyButton content={blueprintString} marginBottom="0.5rem" />}
          <textarea
            value={blueprintString || "Loading..."}
            readOnly
            css={{
              width: "100%",
              height: "100px",
              resize: "none",
              color: "#fff",
              backgroundColor: "#414040",
            }}
          />
        </>
      </Panel>
      <Panel title="json" gridColumn={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}>
        {showJson ? (
          !data ? (
            <div>Loading...</div>
          ) : (
            <>
              <Button
                variantColor="green"
                css={{ position: "absolute", right: "65px" }}
                onClick={() => {
                  setShowJson(false);
                  if (selected.type === "blueprint_book") {
                    setData(null);
                  }
                }}
              >
                hide
              </Button>
              <pre css={{ maxHeight: "500px", overflowY: "scroll" }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </>
          )
        ) : (
          <Button
            variantColor="green"
            onClick={() => {
              setShowJson(true);
              if (selected.type === "blueprint_book") {
                fetch(`/api/string/${selectedHash}`)
                  .then((res) => res.text())
                  .then((string) => {
                    const { data } = parseBlueprintStringClient(string);
                    setData(data);
                  });
              }
            }}
          >
            show
          </Button>
        )}
      </Panel>
    </Grid>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  const throwError = (message: string) => {
    if (!blueprint_page && context.res) {
      context.res.statusCode = 404;
      context.res.end({ error: message });
      return {};
    }
  };

  const tl = timeLogger("getServerSideProps");
  const selected_id = context.query.selected ? (context.query.selected as string) : null;
  const type = context.query.type ? (context.query.type as string) : null;
  const blueprintId = context.query.blueprintId ? (context.query.blueprintId as string) : null;

  if (!blueprintId) return throwError("Blueprint ID not found");

  const blueprint_page = await getBlueprintPageById(blueprintId);
  tl("getBlueprintPageById");

  if (!blueprint_page) return throwError("Blueprint page not found");

  let blueprint: IndexProps["blueprint"] = null;
  let blueprint_book: IndexProps["blueprint_book"] = null;
  let selected!: IndexProps["selected"];
  let selected_blueprint!: BlueprintEntry | null;
  let selected_blueprint_book!: BlueprintBookEntry | null;

  if (blueprint_page.blueprint_id) {
    blueprint = await getBlueprintById(blueprint_page.blueprint_id);
    selected_blueprint = blueprint;
    tl("getBlueprintById");
    // blueprint_string = await getBlueprintStringByHash(blueprint.blueprint_hash);
  } else if (blueprint_page.blueprint_book_id) {
    blueprint_book = await getBlueprintBookById(blueprint_page.blueprint_book_id);
    if (selected_id && type === "book") {
      selected_blueprint_book = await getBlueprintBookById(selected_id);
      tl("getBlueprintBookById");
    } else if (selected_id && type !== "book") {
      selected_blueprint = await getBlueprintById(selected_id);
      tl("getBlueprintById");
    } else if (blueprint_book) {
      selected_blueprint_book = blueprint_book;
    }
  }

  if (selected_blueprint) {
    selected = {
      type: "blueprint",
      data: {
        id: selected_blueprint.id,
        blueprint_hash: selected_blueprint.blueprint_hash,
        image_hash: selected_blueprint.image_hash,
      },
    };
  } else if (selected_blueprint_book) {
    selected = {
      type: "blueprint_book",
      data: {
        id: selected_blueprint_book.id,
        blueprint_hash: selected_blueprint_book.blueprint_hash,
      },
    };
  }

  // selected = {type: 'blueprint', data: {id: blueprint.id}}
  const image_exists =
    selected.type === "blueprint" ? await hasBlueprintImage(selected.data.image_hash) : false;

  return {
    props: {
      image_exists,
      blueprint,
      blueprint_book,
      selected,
      blueprint_page,
    } as IndexProps,
  };
}

export default Index;
